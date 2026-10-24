import {streamParticipantsTable, streamsTable} from "../../../db/schema/jj-schema.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {and, eq, type SQLWrapper} from "drizzle-orm";
import type {BatchResponse} from "drizzle-orm/batch";
import {ScheduleDaySchema, ScheduleWeekSchema, StreamSchema} from "../schemas/schedules.ts";
import {z} from "zod/v4";
import type {JJDrizzleDatabase} from "../../../db/db.ts";
import {streamTagsTable, tags} from "../../../db/schema/tags-schema.ts";

/**
 * Helper function to get streams for a schedule with their tags and participants, in one round trip
 */
export async function getScheduleStreams(db: JJDrizzleDatabase, scheduleId: number) {
  return assembleScheduleStreams(await db.batch(scheduleStreamsQueries(db, scheduleId)))
}

/**
 * The three reads behind `getScheduleStreams`, for one `db.batch()`: visible streams, their tags and
 * their participants. `scheduleId` may be a scalar subquery, so callers can batch these with the
 * statement that finds the schedule; a subquery that finds nothing reads no stream.
 */
export function scheduleStreamsQueries(db: JJDrizzleDatabase, scheduleId: number | SQLWrapper) {
  // Get all streams for the schedule
  const streams = db.select({
    id: streamsTable.id,
    scheduleId: streamsTable.scheduleId,
    createdBy: streamsTable.createdBy,
    title: streamsTable.title,
    visible: streamsTable.visible,
    subtitle: streamsTable.subtitle,
    description: streamsTable.description,
    youtubeVodUrl: streamsTable.youtubeVodUrl,
    twitchVodUrl: streamsTable.twitchVodUrl,
    start: streamsTable.start,
    end: streamsTable.end,
  })
    .from(streamsTable)
    .where(and(
      eq(streamsTable.scheduleId, scheduleId),
      eq(streamsTable.visible, true)
    ));

  // Get tags for all streams
  const streamTags = db.select({
    streamId: streamTagsTable.streamId,
    name: tags.name,
    slug: tags.slug,
    color: tags.color,
  })
    .from(streamTagsTable)
    .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
    .where(eq(streamTagsTable.scheduleId, scheduleId));

  // Get participants for all streams
  const streamParticipants = db.select({
    streamId: streamParticipantsTable.streamId,
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(streamParticipantsTable)
    .innerJoin(userDisplayView, eq(streamParticipantsTable.userId, userDisplayView.userId))
    .where(eq(streamParticipantsTable.scheduleId, scheduleId));

  return [streams, streamTags, streamParticipants] as const;
}

/** Streams with their tags and participants, from the results of `scheduleStreamsQueries`. */
export function assembleScheduleStreams(
  [streams, streamTags, streamParticipants]: BatchResponse<ReturnType<typeof scheduleStreamsQueries>>,
) {
  // Group tags and participants by stream
  const streamTagsMap = new Map<number, Array<{ name: string; slug: string; color: string }>>();
  const streamParticipantsMap = new Map<number, Array<{
    userId: number;
    primaryLiveStream: string;
    createdAt: Date;
    username: string;
    profileImage: string;
    twitchLogin: string | null;
    tiltifySlug: string;
    tiltifyUrl: string;
    primaryColor: string | null;
    accentColor: string | null;
  }>>();

  for (const tag of streamTags) {
    if (!streamTagsMap.has(tag.streamId)) {
      streamTagsMap.set(tag.streamId, []);
    }
    streamTagsMap.get(tag.streamId)!.push({ name: tag.name, slug: tag.slug, color: tag.color });
  }

  for (const participant of streamParticipants) {
    if (!streamParticipantsMap.has(participant.streamId)) {
      streamParticipantsMap.set(participant.streamId, []);
    }
    streamParticipantsMap.get(participant.streamId)!.push({
      userId: participant.userId,
      primaryLiveStream: participant.primaryLiveStream,
      createdAt: participant.createdAt,
      username: participant.username,
      profileImage: participant.profileImage,
      twitchLogin: participant.twitchLogin,
      tiltifySlug: participant.tiltifySlug,
      tiltifyUrl: participant.tiltifyUrl,
      primaryColor: participant.primaryColor,
      accentColor: participant.accentColor,
    });
  }

  return streams.map(stream => ({
    ...stream,
    isTimeTBD: false,
    tags: streamTagsMap.get(stream.id) || [],
    participants: streamParticipantsMap.get(stream.id) || [],
  }));
}

/**
 * Helper function to organize streams by days and weeks
 */
export function organizeStreamsByTime(streams: z.infer<typeof StreamSchema>[]): {
  days: z.infer<typeof ScheduleDaySchema>[];
  weeks: z.infer<typeof ScheduleWeekSchema>[];
} {
  // Group streams by day
  const dayGroups = new Map<string, typeof streams>();

  for (const stream of streams) {
    const dayKey = stream.start.toISOString().split('T')[0];
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, []);
    }
    dayGroups.get(dayKey)!.push(stream);
  }

  const days = Array.from(dayGroups.entries()).map(([dayKey, dayStreams]) => ({
    day: new Date(dayKey + 'T00:00:00.000Z'),
    streams: dayStreams.sort((a, b) => a.start.getTime() - b.start.getTime()),
  })).sort((a, b) => a.day.getTime() - b.day.getTime());

  // Group days into weeks
  const weeks: Array<{
    startDate: string;
    endDate: string;
    days: typeof days;
    streams: typeof streams;
  }> = [];

  if (days.length > 0) {
    let currentWeekStart = new Date(days[0].day);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    let currentWeekDays: typeof days = [];
    let currentWeekStreams: typeof streams = [];

    for (const day of days) {
      const dayDate = day.day;
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (dayDate > weekEnd) {
        // Start new week
        if (currentWeekDays.length > 0) {
          weeks.push({
            startDate: currentWeekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            days: currentWeekDays,
            streams: currentWeekStreams,
          });
        }

        currentWeekStart = new Date(dayDate);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        currentWeekDays = [day];
        currentWeekStreams = [...day.streams];
      } else {
        currentWeekDays.push(day);
        currentWeekStreams.push(...day.streams);
      }
    }

    // Add final week
    if (currentWeekDays.length > 0) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        days: currentWeekDays,
        streams: currentWeekStreams,
      });
    }
  }

  return { days, weeks };
}

/**
 * Helper function to get the next 3 future streams from a list of streams
 * Compares stream start times to the current date and time
 */
export function getNextStreams(streams: z.infer<typeof StreamSchema>[]): z.infer<typeof StreamSchema>[] {
  const currentDate = new Date();

  // Filter streams that start in the future, sort by start time, and take first 3
  return streams
    .filter(stream => stream.start > currentDate)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);
}

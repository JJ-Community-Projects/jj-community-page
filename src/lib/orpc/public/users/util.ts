import type {DrizzleD1Database} from 'drizzle-orm/d1';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {friendsTable, userSocials} from '../../../db/schema/auth-schema.ts';
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
  teamMembersTable,
  teamsTable
} from '../../../db/schema/jj-schema.ts';
import {and, asc, desc, eq, gt, sql} from 'drizzle-orm';
import type {BatchResponse} from 'drizzle-orm/batch';
import {ORPCError} from '@orpc/server';
import {TeamSchema} from '../schemas/teams.ts';
import {z} from "zod/v4";
import type {JJDrizzleDatabase} from "../../../db/db.ts";
import {type StreamTag, streamTagsTable, tags, type UserTag, userTagsTable} from "../../../db/schema/tags-schema.ts";
import type {ScheduleInfoSchema} from "../schemas/schedules.ts";
import type {SocialSchema} from "../schemas/social.ts";
import type {UserDisplaySchema} from "../schemas/UserDisplaySchema.ts";

/**
 * Helper functions for the getUserProfileBySlug procedure
 * These functions modularize the complex data fetching logic for better maintainability
 */

// Type definitions using Zod schemas for better type safety
type Database = DrizzleD1Database<Record<string, never>>;

// Use Zod type inferences instead of custom interfaces
export type UserDisplay = z.infer<typeof UserDisplaySchema>;
export type UserTagType = UserTag;
export type UserSocial = z.infer<typeof SocialSchema>;
export type TeamInfo = z.infer<typeof TeamSchema>;
export type ScheduleInfo = z.infer<typeof ScheduleInfoSchema>;
export type StreamParticipant = z.infer<typeof UserDisplaySchema>;
export type StreamTagType = StreamTag;
export type StreamInfo = {
  id: number;
  scheduleId: number;
  createdBy: number;
  title: string;
  visible: boolean;
  subtitle: string | null;
  description: string | null;
  youtubeVodUrl: string | null;
  twitchVodUrl: string | null;
  start: Date;
  end: Date;
  tags: Array<{ name: string; slug: string; color: string }>;
  participants: StreamParticipant[];
};

/**
 * Fetches user by tiltify slug
 * @param db Database connection
 * @param slug Tiltify slug to search for
 * @returns User display information
 * @throws ORPCError if user not found
 */
export async function getUserBySlug(db: JJDrizzleDatabase, slug: string): Promise<UserDisplay> {
  const user = await db.select({
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
    .from(userDisplayView)
    .where(eq(userDisplayView.tiltifySlug, slug))
    .get();

  if (!user) {
    throw new ORPCError('NOT_FOUND');
  }

  return user;
}

/**
 * The profile's reads after the user lookup, for one `db.batch()`. Each helper returns a query,
 * not its result.
 */

/** All tags associated with a user */
export function userTagsQuery(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    name: tags.name,
    slug: tags.slug,
    color: tags.color,
  })
    .from(userTagsTable)
    .innerJoin(tags, eq(userTagsTable.tagId, tags.id))
    .where(eq(userTagsTable.userId, userId));
}

/** All social media links of a user */
export function userSocialsQuery(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    provider: userSocials.provider,
    url: userSocials.url,
  })
    .from(userSocials)
    .where(eq(userSocials.userId, userId));
}

/** All friends of a user. A friendship is stored as two rows, one per direction. */
export function userFriendsQuery(db: JJDrizzleDatabase, userId: number) {
  return db.select({
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
    .from(friendsTable)
    .innerJoin(userDisplayView, eq(userDisplayView.userId, friendsTable.toUserId))
    .where(eq(friendsTable.fromUserId, userId));
}

/** All visible teams that a user is part of */
export function userTeamsQuery(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: teamsTable.id,
    name: teamsTable.name,
    slug: teamsTable.slug,
    description: teamsTable.description,
    visible: teamsTable.visible,
    ownerId: teamsTable.ownerId
  })
    .from(teamMembersTable)
    .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
    .where(and(
      eq(teamMembersTable.userId, userId),
      eq(teamsTable.visible, true)
    ));
}

// The primary schedule is the first visible primary one in this order.
const scheduleOrder = [desc(schedulesTable.primary), desc(schedulesTable.year), desc(schedulesTable.createdAt)];

/** All visible schedules of a user; `primarySchedule` picks the primary one from the result */
export function userSchedulesQuery(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: schedulesTable.id,
    title: schedulesTable.title,
    slug: schedulesTable.slug,
    year: schedulesTable.year,
    visible: schedulesTable.visible,
    primary: schedulesTable.primary,
    ownerId: schedulesTable.ownerId,
    createdAt: schedulesTable.createdAt,
    updatedAt: schedulesTable.updatedAt,
  })
    .from(schedulesTable)
    .where(and(
      eq(schedulesTable.ownerId, userId),
      eq(schedulesTable.visible, true)
    ))
    .orderBy(...scheduleOrder);
}

export function primarySchedule(schedules: ScheduleInfo[]): ScheduleInfo | undefined {
  return schedules.find(s => s.primary) || undefined;
}

/**
 * The next 3 streams of the user's primary schedule with their tags and participants: three
 * statements for the same batch. The primary schedule and the 3 streams are found by subqueries
 * (same rule as `userSchedulesQuery` + `primarySchedule`), so nothing waits for another result.
 */
export function primaryStreamsQueries(db: JJDrizzleDatabase, userId: number, now: Date) {
  const primaryScheduleId = db.select({id: schedulesTable.id})
    .from(schedulesTable)
    .where(and(
      eq(schedulesTable.ownerId, userId),
      eq(schedulesTable.visible, true),
      eq(schedulesTable.primary, true)
    ))
    .orderBy(...scheduleOrder)
    .limit(1);
  const isNext = and(
    eq(streamsTable.visible, true),
    eq(streamsTable.scheduleId, primaryScheduleId),
    gt(streamsTable.start, now)
  );
  const nextOrder = [asc(streamsTable.start), asc(streamsTable.id)];
  const nextStreamKeys = db.select({scheduleId: streamsTable.scheduleId, id: streamsTable.id})
    .from(streamsTable)
    .where(isNext)
    .orderBy(...nextOrder)
    .limit(3);

  return [
    db.select({
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
      .where(isNext)
      .orderBy(...nextOrder)
      .limit(3),
    db.select({
      scheduleId: streamTagsTable.scheduleId,
      streamId: streamTagsTable.streamId,
      name: tags.name,
      slug: tags.slug,
      color: tags.color,
    })
      .from(streamTagsTable)
      .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
      .where(sql`(${streamTagsTable.scheduleId}, ${streamTagsTable.streamId}) in ${nextStreamKeys}`),
    db.select({
      streamId: streamParticipantsTable.streamId,
      scheduleId: streamParticipantsTable.scheduleId,
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
      .where(sql`(${streamParticipantsTable.scheduleId}, ${streamParticipantsTable.streamId}) in ${nextStreamKeys}`),
  ] as const;
}

/** A stream's key: stream ids are only unique within their schedule. */
const streamKey = (scheduleId: number, streamId: number) => `${scheduleId}:${streamId}`;

/** The primary schedule's next streams with their tags and participants, from `primaryStreamsQueries`. */
export function assemblePrimaryStreams(
  [streams, streamTags, streamParticipants]: BatchResponse<ReturnType<typeof primaryStreamsQueries>>,
): StreamInfo[] {
  // Group tags by stream
  const streamTagsMap = new Map<string, Array<{ name: string; slug: string; color: string }>>();
  for (const tag of streamTags) {
    const key = streamKey(tag.scheduleId, tag.streamId);
    if (!streamTagsMap.has(key)) {
      streamTagsMap.set(key, []);
    }
    streamTagsMap.get(key)!.push({name: tag.name, slug: tag.slug, color: tag.color});
  }

  // Group participants by stream
  const streamParticipantsMap = new Map<string, StreamParticipant[]>();
  for (const {streamId, scheduleId, ...participant} of streamParticipants) {
    const key = streamKey(scheduleId, streamId);
    if (!streamParticipantsMap.has(key)) {
      streamParticipantsMap.set(key, []);
    }
    streamParticipantsMap.get(key)!.push(participant);
  }

  return streams.map(stream => ({
    ...stream,
    tags: streamTagsMap.get(streamKey(stream.scheduleId, stream.id)) || [],
    participants: streamParticipantsMap.get(streamKey(stream.scheduleId, stream.id)) || [],
  }));
}

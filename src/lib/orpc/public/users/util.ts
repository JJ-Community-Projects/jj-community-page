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
import {and, asc, desc, eq, gt, inArray, ne, or} from 'drizzle-orm';
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
 * Fetches all tags associated with a user
 * @param db Database connection
 * @param userId User ID to fetch tags for
 * @returns Array of user tags with tag information
 */
export async function getUserTags(db: JJDrizzleDatabase, userId: number): Promise<Array<{
  name: string;
  slug: string;
  color: string
}>> {
  return db.select({
    name: tags.name,
    slug: tags.slug,
    color: tags.color,
  })
    .from(userTagsTable)
    .innerJoin(tags, eq(userTagsTable.tagId, tags.id))
    .where(eq(userTagsTable.userId, userId))
    .all();
}

/**
 * Fetches all social media links for a user
 * @param db Database connection
 * @param userId User ID to fetch socials for
 * @returns Array of user social media links
 */
export async function getUserSocials(db: JJDrizzleDatabase, userId: number): Promise<UserSocial[]> {
  return db.select({
    provider: userSocials.provider,
    url: userSocials.url,
  })
    .from(userSocials)
    .where(eq(userSocials.userId, userId))
    .all();
}

/**
 * Fetches all friends of a user
 * @param db Database connection
 * @param userId User ID to fetch friends for
 * @returns Array of friend user display information
 */
export async function getUserFriends(db: JJDrizzleDatabase, userId: number): Promise<UserDisplay[]> {
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
    .innerJoin(userDisplayView,
      or(
        and(eq(friendsTable.fromUserId, userId), eq(userDisplayView.userId, friendsTable.toUserId)),
        and(eq(friendsTable.toUserId, userId), eq(userDisplayView.userId, friendsTable.fromUserId))
      )
    )
    .where(
      eq(friendsTable.fromUserId, userId),
    )
    .all();
}

/**
 * Fetches all visible teams that a user is part of
 * @param db Database connection
 * @param userId User ID to fetch teams for
 * @returns Array of team information
 */
export async function getUserTeams(db: JJDrizzleDatabase, userId: number): Promise<TeamInfo[]> {
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
    ))
    .all();
}

/**
 * Fetches all visible schedules for a user and extracts primary schedule
 * @param db Database connection
 * @param userId User ID to fetch schedules for
 * @returns Object with schedules array and optional primary schedule
 */
export async function getUserSchedules(db: JJDrizzleDatabase, userId: number): Promise<{
  schedules: ScheduleInfo[];
  primarySchedule: ScheduleInfo | undefined;
}> {
  const schedules = await db.select({
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
    .orderBy(desc(schedulesTable.primary), desc(schedulesTable.year), desc(schedulesTable.createdAt))
    .all();

  // Extract primary schedule from results
  const primarySchedule = schedules.find(s => s.primary) || undefined;

  return {schedules, primarySchedule};
}

/** A stream's key: stream ids are only unique within their schedule. */
type StreamKey = { scheduleId: number; id: number };

const streamKey = (scheduleId: number, streamId: number) => `${scheduleId}:${streamId}`;

/**
 * Fetches stream tags for given streams
 * @param db Database connection
 * @param streams Streams by (schedule ID, stream ID)
 * @returns Map of stream key (`streamKey`) to array of tags
 */
export async function getStreamTagsMap(db: JJDrizzleDatabase, streams: StreamKey[]): Promise<Map<string, Array<{
  name: string;
  slug: string;
  color: string
}>>> {
  if (streams.length === 0) {
    return new Map();
  }

  const streamTags = await db.select({
    scheduleId: streamTagsTable.scheduleId,
    streamId: streamTagsTable.streamId,
    name: tags.name,
    slug: tags.slug,
    color: tags.color,
  })
    .from(streamTagsTable)
    .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
    .where(or(...streams.map(s => and(
      eq(streamTagsTable.scheduleId, s.scheduleId),
      eq(streamTagsTable.streamId, s.id),
    ))))
    .all();

  // Group tags by stream
  const streamTagsMap = new Map<string, Array<{ name: string; slug: string; color: string }>>();
  for (const tag of streamTags) {
    const key = streamKey(tag.scheduleId, tag.streamId);
    if (!streamTagsMap.has(key)) {
      streamTagsMap.set(key, []);
    }
    streamTagsMap.get(key)!.push({name: tag.name, slug: tag.slug, color: tag.color});
  }

  return streamTagsMap;
}

/**
 * Fetches stream participants for given streams
 * @param db Database connection
 * @param streams Streams by (schedule ID, stream ID)
 * @returns Map of stream key (`streamKey`) to array of participants
 */
export async function getStreamParticipantsMap(db: JJDrizzleDatabase, streams: StreamKey[]): Promise<Map<string, StreamParticipant[]>> {
  if (streams.length === 0) {
    return new Map();
  }

  const streamParticipants = await db.select({
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
    .where(or(...streams.map(s => and(
      eq(streamParticipantsTable.scheduleId, s.scheduleId),
      eq(streamParticipantsTable.streamId, s.id),
    ))))
    .all();

  // Group participants by stream
  const streamParticipantsMap = new Map<string, StreamParticipant[]>();
  for (const participant of streamParticipants) {
    const key = streamKey(participant.scheduleId, participant.streamId);
    if (!streamParticipantsMap.has(key)) {
      streamParticipantsMap.set(key, []);
    }
    streamParticipantsMap.get(key)!.push({
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

  return streamParticipantsMap;
}

/**
 * Enriches streams with their tags and participants
 * @param streams Array of basic stream information
 * @param streamTagsMap Map of stream key to tags
 * @param streamParticipantsMap Map of stream key to participants
 * @returns Array of enriched stream information
 */
export function enrichStreamsWithTagsAndParticipants(
  streams: Array<{
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
  }>,
  streamTagsMap: Map<string, Array<{ name: string; slug: string; color: string }>>,
  streamParticipantsMap: Map<string, StreamParticipant[]>
): StreamInfo[] {
  return streams.map(stream => ({
    ...stream,
    tags: streamTagsMap.get(streamKey(stream.scheduleId, stream.id)) || [],
    participants: streamParticipantsMap.get(streamKey(stream.scheduleId, stream.id)) || [],
  }));
}

/**
 * Fetches next streams from user's own schedules
 * @param db Database connection
 * @param userScheduleIds Array of schedule IDs owned by the user
 * @returns Array of enriched stream information (max 3)
 */
export async function getUserOwnStreams(db: JJDrizzleDatabase, userScheduleIds: number[]): Promise<StreamInfo[]> {
  if (userScheduleIds.length === 0) {
    return [];
  }

  const currentDate = new Date();

  // Only fetch streams from user's schedules with date filtering at DB level
  const futureUserStreams = await db.select({
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
      eq(streamsTable.visible, true),
      inArray(streamsTable.scheduleId, userScheduleIds),
      gt(streamsTable.start, currentDate)
    ))
    .orderBy(asc(streamsTable.start))
    .limit(3);

  if (futureUserStreams.length === 0) {
    return [];
  }

  // Get tags and participants for these streams
  const [streamTagsMap, streamParticipantsMap] = await Promise.all([
    getStreamTagsMap(db, futureUserStreams),
    getStreamParticipantsMap(db, futureUserStreams)
  ]);

  return enrichStreamsWithTagsAndParticipants(
    futureUserStreams,
    streamTagsMap,
    streamParticipantsMap
  );
}

/**
 * Fetches next streams from the user's primary schedule only
 * @param db Database connection
 * @param primaryScheduleId Primary schedule ID (optional)
 * @returns Array of enriched stream information (max 3)
 */
export async function getUserPrimaryStreams(db: JJDrizzleDatabase, primaryScheduleId?: number): Promise<StreamInfo[]> {
  if (!primaryScheduleId) {
    return [];
  }

  const currentDate = new Date();

  // Fetch streams from the primary schedule only
  const futurePrimaryStreams = await db.select({
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
      eq(streamsTable.visible, true),
      eq(streamsTable.scheduleId, primaryScheduleId),
      gt(streamsTable.start, currentDate)
    ))
    .orderBy(asc(streamsTable.start))
    .limit(3);

  if (futurePrimaryStreams.length === 0) {
    return [];
  }

  // Get tags and participants for these streams
  const [streamTagsMap, streamParticipantsMap] = await Promise.all([
    getStreamTagsMap(db, futurePrimaryStreams),
    getStreamParticipantsMap(db, futurePrimaryStreams)
  ]);

  return enrichStreamsWithTagsAndParticipants(
    futurePrimaryStreams,
    streamTagsMap,
    streamParticipantsMap
  );
}

/**
 * Fetches next streams from other users' schedules where this user is a participant
 * @param db Database connection
 * @param userId User ID to find participation for
 * @returns Array of enriched stream information (max 3)
 */
export async function getUserParticipatingStreams(db: JJDrizzleDatabase, userId: number): Promise<StreamInfo[]> {
  const currentDate = new Date();

  const futureOtherStreams = await db.select({
    streamId: streamParticipantsTable.streamId,
    scheduleId: streamParticipantsTable.scheduleId,
    id: streamsTable.id,
    createdBy: streamsTable.createdBy,
    title: streamsTable.title,
    visible: streamsTable.visible,
    subtitle: streamsTable.subtitle,
    description: streamsTable.description,
    youtubeVodUrl: streamsTable.youtubeVodUrl,
    twitchVodUrl: streamsTable.twitchVodUrl,
    start: streamsTable.start,
    end: streamsTable.end,
    scheduleOwnerId: schedulesTable.ownerId,
  })
    .from(streamParticipantsTable)
    .innerJoin(streamsTable, and(
      eq(streamParticipantsTable.streamId, streamsTable.id),
      eq(streamParticipantsTable.scheduleId, streamsTable.scheduleId)
    ))
    .innerJoin(schedulesTable, eq(streamsTable.scheduleId, schedulesTable.id))
    .where(and(
      eq(streamParticipantsTable.userId, userId),
      eq(streamsTable.visible, true),
      eq(schedulesTable.visible, true),
      ne(schedulesTable.ownerId, userId),
      gt(streamsTable.start, currentDate)
    ))
    .orderBy(asc(streamsTable.start))
    .limit(3);

  if (futureOtherStreams.length === 0) {
    return [];
  }

  // Filter future streams, sort by start time, take first 3
  const futureOtherStreamsFiltered = futureOtherStreams
    .filter(stream => stream.start > currentDate)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);

  if (futureOtherStreamsFiltered.length === 0) {
    return [];
  }

  // Get tags and participants for these streams
  const [streamTagsMap, streamParticipantsMap] = await Promise.all([
    getStreamTagsMap(db, futureOtherStreamsFiltered),
    getStreamParticipantsMap(db, futureOtherStreamsFiltered)
  ]);

  // Map to proper stream format and enrich
  const streamsForEnrichment = futureOtherStreamsFiltered.map(stream => ({
    id: stream.id,
    scheduleId: stream.scheduleId,
    createdBy: stream.createdBy,
    title: stream.title,
    visible: stream.visible,
    subtitle: stream.subtitle,
    description: stream.description,
    youtubeVodUrl: stream.youtubeVodUrl,
    twitchVodUrl: stream.twitchVodUrl,
    start: stream.start,
    end: stream.end,
  }));

  return enrichStreamsWithTagsAndParticipants(
    streamsForEnrichment,
    streamTagsMap,
    streamParticipantsMap
  );
}

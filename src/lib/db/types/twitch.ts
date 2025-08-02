import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { twitchChannelSchema, twitchStreamSchema } from "../schema/twitch-channel-schema.ts";

/**
 * TwitchChannel entity type from database schema
 */
export type TwitchChannel = InferSelectModel<typeof twitchChannelSchema>;

/**
 * TwitchChannel insert type for creating new twitch channels
 */
export type TwitchChannelInsert = InferInsertModel<typeof twitchChannelSchema>;

/**
 * TwitchStream entity type from database schema
 */
export type TwitchStream = InferSelectModel<typeof twitchStreamSchema>;

/**
 * TwitchStream insert type for creating new twitch streams
 */
export type TwitchStreamInsert = InferInsertModel<typeof twitchStreamSchema>;

/**
 * Input type for creating a new twitch channel
 */
export interface TwitchChannelInput {
  userId: number;
  id: string; // twitch id
  login: string;
  displayName: string;
  description?: string;
  profileImageUrl?: string;
  offlineImageUrl?: string;
}

/**
 * Input type for updating a twitch channel
 */
export interface TwitchChannelUpdateInput {
  login?: string;
  displayName?: string;
  description?: string;
  profileImageUrl?: string;
  offlineImageUrl?: string;
}

/**
 * Input type for creating a new twitch stream
 */
export interface TwitchStreamInput {
  streamId: string;
  twitchId: string;
  userLogin: string;
  userName: string;
  gameId?: string;
  gameName?: string;
  type?: string;
  title?: string;
  viewerCount?: number;
  startedAt?: string;
  language?: string;
  thumbnailUrl?: string;
  tagIds?: string;
  isMature?: boolean;
}

/**
 * Input type for updating a twitch stream
 */
export interface TwitchStreamUpdateInput {
  gameId?: string;
  gameName?: string;
  type?: string;
  title?: string;
  viewerCount?: number;
  language?: string;
  thumbnailUrl?: string;
  tagIds?: string;
  isMature?: boolean;
}

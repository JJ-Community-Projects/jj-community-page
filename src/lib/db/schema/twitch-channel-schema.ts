// src/lib/db/schema/twitch-channel-schema.ts
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {users} from "./auth-schema.ts";

/**
 * Twitch channels table that stores information about users' Twitch channels.
 * Contains profile data fetched from the Twitch API.
 * Each record is linked to a user in the users table.
 */
export const twitchChannelSchema = sqliteTable('twitch_channels', {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {
    onDelete: 'cascade'
  }),
  id: text('id').primaryKey().notNull(), // twitch id
  login: text('login').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  profileImageUrl: text('profile_image_url'),
  offlineImageUrl: text('offline_image_url'),
})

/**
 * Twitch streams table that stores information about active Twitch streams.
 * Contains stream data fetched from the Twitch API.
 * Used to display live status and stream details on the platform.
 */
export const twitchStreamSchema = sqliteTable('twitch_streams', {
  streamId: text('id').primaryKey(), // stream id
  twitchId: text('user_id').notNull(), // twitch id, reference to twitchChannelSchema.id
  userLogin: text('user_login').notNull(),
  userName: text('user_name').notNull(),
  gameId: text('game_id'),
  gameName: text('game_name'),
  type: text('type'),
  title: text('title'),
  viewerCount: integer('viewer_count', { mode: 'number' }),
  startedAt: text('started_at'),
  language: text('language'),
  thumbnailUrl: text('thumbnail_url'),
  tagIds: text('tag_ids'),
  isMature: integer('is_mature', { mode: 'boolean' }),
})

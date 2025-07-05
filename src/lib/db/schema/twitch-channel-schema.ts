// src/lib/db/schema/twitch-channel-schema.ts
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {users} from "./auth-schema.ts";

export const twitchChannelSchema = sqliteTable('twitch_channels', {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {
    onDelete: 'cascade'
  }),
  id: text('id').primaryKey(), // twitch id
  login: text('login').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  profileImageUrl: text('profile_image_url'),
  offlineImageUrl: text('offline_image_url'),
})

export const twitchStreamSchema = sqliteTable('twitch_streams', {
  id: text('id').primaryKey(), // stream id
  userId: text('user_id').notNull(), // twitch id, reference to twitchChannelSchema.id
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

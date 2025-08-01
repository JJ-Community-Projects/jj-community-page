// src/lib/db/schema/youtube-channel-schema.ts
import {integer, primaryKey, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {users} from "./auth-schema.ts";

/**
 * YouTube Channel table that stores basic information about users' YouTube channels.
 * Contains core channel identifiers fetched from the YouTube API.
 * Each record is linked to a user in the users table.
 */
export const youtubeChannel = sqliteTable('youtube_channel', {
  userId: integer('user_id').references(() => users.id),
  id: text('id').primaryKey(), // YouTube Channel ID
  kind: text('kind'),
  etag: text('etag'),
});

/**
 * YouTube Snippet table that stores detailed information about YouTube channels.
 * Contains metadata like title, description, and publishing information.
 * Each record is linked to a channel in the youtubeChannel table.
 */
export const youtubeSnippet = sqliteTable('youtube_snippet', {
  channelId: text('channel_id').primaryKey().references(() => youtubeChannel.id),
  title: text('title'),
  description: text('description'),
  customUrl: text('customUrl'),
  publishedAt: text('publishedAt'),
  country: text('country'),
});

/**
 * YouTube Thumbnail table that stores image information for YouTube channels.
 * Contains URLs and dimensions for different thumbnail resolutions (default, medium, high).
 * Each record is linked to a channel in the youtubeChannel table.
 */
export const youtubeThumbnail = sqliteTable('youtube_thumbnail', {
  channelId: text('channel_id').references(() => youtubeChannel.id),
  resolution: text('resolution'), // 'default', 'medium', 'high'
  url: text('url'),
  width: integer('width'),
  height: integer('height'),
}, (table) => {
  return [
    primaryKey({name:'pk', columns: [table.channelId, table.resolution]})
  ]
});

/**
 * YouTube Localized table that stores internationalized versions of channel information.
 * Contains localized titles and descriptions for different regions/languages.
 * Each record is linked to a channel in the youtubeChannel table.
 */
export const youtubeLocalized = sqliteTable('youtube_localized', {
  channelId: text('channel_id').primaryKey().references(() => youtubeChannel.id),
  title: text('title'),
  description: text('description'),
});

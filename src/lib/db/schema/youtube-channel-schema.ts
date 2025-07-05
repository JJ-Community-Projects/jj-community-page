import {integer, primaryKey, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {users} from "./auth-schema.ts";

// YouTube Channel basic info
export const youtubeChannel = sqliteTable('youtube_channel', {
  userId: integer('user_id').references(() => users.id),
  id: text('id').primaryKey(), // YouTube Channel ID
  kind: text('kind'),
  etag: text('etag'),
});

// Snippet info
export const youtubeSnippet = sqliteTable('youtube_snippet', {
  channelId: text('channel_id').primaryKey().references(() => youtubeChannel.id),
  title: text('title'),
  description: text('description'),
  customUrl: text('customUrl'),
  publishedAt: text('publishedAt'),
  country: text('country'),
});

// Thumbnails: default, medium, high
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

// Localized version of snippet info
export const youtubeLocalized = sqliteTable('youtube_localized', {
  channelId: text('channel_id').primaryKey().references(() => youtubeChannel.id),
  title: text('title'),
  description: text('description'),
});

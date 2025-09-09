import {integer, primaryKey, sqliteTable, text, uniqueIndex, index, foreignKey} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
import {users} from './auth-schema.ts';
import {schedulesTable} from './jj-schema.ts';

/**
 * Draft streams edited under a schedule. Mirrors canonical streams but isolated per schedule.
 * New draft-only streams can use temporary negative IDs before publish.
 */
export const editStreamsTable = sqliteTable('edit_streams', {
  /** Composite PK: (scheduleId, id) */
  id: integer('id').notNull(),
  scheduleId: integer('schedule_id').references(() => schedulesTable.id, { onDelete: 'cascade' }).notNull(),

  createdBy: integer('created_by').references(() => users.id).notNull(),

  title: text('title').notNull(),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(false),
  subtitle: text('subtitle'),
  description: text('description'),
  youtubeVodUrl: text('youtube_vod_url'),
  twitchVodUrl: text('twitch_vod_url'),

  start: integer('start_time', { mode: 'timestamp' }).notNull(),
  end: integer('end_time', { mode: 'timestamp' }).notNull(),

  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  primaryKey({ name: 'edit_streams_pk', columns: [table.scheduleId, table.id] }),
  index('edit_streams_schedule_idx').on(table.scheduleId),
  index('edit_streams_start_idx').on(table.start),
]);

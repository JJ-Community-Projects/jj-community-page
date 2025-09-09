import {integer, primaryKey, sqliteTable, index, foreignKey} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
import {tags} from './tags-schema.ts';
import {editStreamsTable} from './edit-streams-schema.ts';

/**
 * Draft stream tags linking edit_streams to canonical tags during editing
 */
export const editStreamTagsTable = sqliteTable('edit_stream_tags', {
  streamId: integer('stream_id').notNull(),
  scheduleId: integer('schedule_id').notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  primaryKey({ name: 'edit_stream_tags_pk', columns: [table.scheduleId, table.streamId, table.tagId] }),
  foreignKey({
    name: 'edit_stream_fk',
    columns: [table.scheduleId, table.streamId],
    foreignColumns: [editStreamsTable.scheduleId, editStreamsTable.id],
  }).onDelete('cascade'),
  index('edit_stream_tags_tag_idx').on(table.tagId),
  index('edit_stream_tags_stream_idx').on(table.scheduleId, table.streamId),
]);

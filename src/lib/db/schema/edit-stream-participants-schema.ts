import {foreignKey, index, integer, primaryKey, sqliteTable} from 'drizzle-orm/sqlite-core';
import {users} from './auth-schema.ts';
import {editStreamsTable} from './edit-streams-schema.ts';

/**
 * Draft stream participants linking edit_streams to users during editing
 */
export const editStreamParticipantsTable = sqliteTable('edit_stream_participants', {
  streamId: integer('stream_id').notNull(),
  scheduleId: integer('schedule_id').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ name: 'edit_stream_participants_pk', columns: [table.scheduleId, table.streamId, table.userId] }),
  foreignKey({
    name: 'edit_stream_fk',
    columns: [table.scheduleId, table.streamId],
    foreignColumns: [editStreamsTable.scheduleId, editStreamsTable.id],
  }).onDelete('cascade'),
  index('edit_stream_participants_user_idx').on(table.userId),
  index('edit_stream_participants_stream_idx').on(table.scheduleId, table.streamId),
]);

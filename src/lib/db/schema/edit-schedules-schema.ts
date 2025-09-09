import {index, integer, sqliteTable, text, uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
import {schedulesTable} from './jj-schema.ts';
import {users} from './auth-schema.ts';

/**
 * Draft schedules table for in-progress edits.
 * One active draft per schedule. Tracks who initiated/last edited the draft.
 */
export const editSchedulesTable = sqliteTable('edit_schedules', {
  /** FK to canonical schedules */
  scheduleId: integer('schedule_id').references(() => schedulesTable.id, { onDelete: 'cascade' }).notNull(),
  /** Editor who initiated/last edited the draft */
  editorId: integer('editor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Draft metadata (nullable to allow partial updates)
  title: text('title'),
  slug: text('slug'),
  year: integer('year'),
  visible: integer('visible', { mode: 'boolean' }),

  /** Status of the draft lifecycle */
  status: text('status').$type<'active' | 'published' | 'discarded'>().notNull().default('active'),

  /** Optional optimistic concurrency */
  version: integer('version').notNull().default(1),

  /** Timestamps */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  // Enforce a single draft row per schedule (latest editor tracked in editorId)
  uniqueIndex('edit_schedules_unique_schedule').on(table.scheduleId),
  index('edit_schedules_editor_idx').on(table.editorId),
]);

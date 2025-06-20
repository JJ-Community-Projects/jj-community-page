// src/lib/db/schema.ts
import {sql} from 'drizzle-orm';
import {foreignKey, integer, primaryKey, sqliteTable, text, uniqueIndex} from 'drizzle-orm/sqlite-core';
import {users} from "./auth-schema.ts";

export const durableObjectsTable = sqliteTable('durable_objects', {
    namespace: text('namespace').notNull(),
    id: text('id').notNull(),

  },
  (table) => [
    uniqueIndex('durable_objects_pk').on(table.namespace, table.id),
  ]
)

export const schedulesTable = sqliteTable('schedules', {
    id: integer().primaryKey({autoIncrement: true}).notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    year: integer('year').notNull(),
    visible: integer({mode: 'boolean'}).notNull(),
    ownerId: integer('owner_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    createdAt: integer('created_at', {mode: 'timestamp'}).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // uniqueIndex('one_schedule_per_year_per_user').on(table.ownerId, table.year),
    uniqueIndex('unique_schedule_slug').on(table.slug),
  ]
);

export const editorsTable = sqliteTable('editors', {
    scheduleId: integer('schedule_id').references(() => schedulesTable.id),
    userId: integer('user_id').references(() => users.id),
  },
  (table) => [
    uniqueIndex('editors_pk').on(table.scheduleId, table.userId),
  ]
);


export const streamsTable = sqliteTable('streams', {
    id: integer('id').notNull(),
    scheduleId: integer('schedule_id').references(() => schedulesTable.id).notNull(),
    createdBy: integer('created_by').references(() => users.id).notNull(),
    title: text('title').notNull(),
    visible: integer({mode: 'boolean'}).notNull().default(false),
    subtitle: text('subtitle'),
    description: text('description'),
    youtubeVodUrl: text('youtube_vod_url'),
    twitchVodUrl: text('twitch_vod_url'),
    start: integer('start_time', {mode: 'timestamp'}).notNull(),
    end: integer('end_time', {mode: 'timestamp'}).notNull(),
  },
  (table) => [
    primaryKey({name: 'pk', columns: [table.scheduleId, table.id]})
  ]
);

export const streamTagsTable = sqliteTable('stream_tags', {
    streamId: integer('stream_id').notNull(),
    scheduleId: integer('schedule_id').notNull(),
    tag: text('tag').notNull(),
    label: text('label').notNull(),
    addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({name: 'stream_tags_pk', columns: [table.scheduleId, table.streamId, table.tag]}),
    foreignKey({
      name: 'stream_schedule_fk',
      columns: [table.scheduleId, table.streamId],
      foreignColumns: [streamsTable.scheduleId, streamsTable.id],
    }).onDelete('cascade'),
  ]
)

export const streamParticipantsTable = sqliteTable('stream_participants', {
  scheduleId: integer('schedule_id').notNull(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(),
}, (table) => [
  uniqueIndex('stream_participants_pk').on(table.scheduleId, table.streamId, table.userId),
  foreignKey({
    name: 'stream_fk',
    columns: [table.scheduleId, table.streamId],
    foreignColumns: [streamsTable.scheduleId, streamsTable.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'user_fk',
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
])



export const teamsTable = sqliteTable('teams', {
    id: integer('team_id').primaryKey({autoIncrement: true}).notNull(),
    ownerId: integer('owner_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    name: text('team_name').notNull(),
    description: text('team_description'),
    slug: text('team_slug').notNull().unique(),
    visible: integer('team_visibility', {mode: 'boolean'}).notNull().default(false),
  },
  (table) => [
    uniqueIndex('team_unique_slug').on(table.slug),
  ]
)

export const teamMembersTable = sqliteTable('team_members', {
    teamId: integer('team_id').references(() => teamsTable.id, {onDelete: 'cascade'}).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
  },
  (table) => [
    uniqueIndex('single_user_per_team').on(table.teamId, table.userId),
  ]
)

export const teamInvitesTable = sqliteTable('team_invites', {
    teamId: integer('team_id').references(() => teamsTable.id).notNull(),
    invitedUserId: integer('invite_id').references(() => users.id).notNull(),
  },
  (table) => [
    uniqueIndex('single_invite_per_user_per_team').on(table.teamId, table.invitedUserId),
  ]
)

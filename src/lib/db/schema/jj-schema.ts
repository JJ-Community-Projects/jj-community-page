// src/lib/db/jj-schema.ts
import {sql} from 'drizzle-orm';
import {foreignKey, integer, primaryKey, sqliteTable, text, uniqueIndex} from 'drizzle-orm/sqlite-core';
import {users} from "./auth-schema";

/**
 * Durable Objects table that tracks Cloudflare Durable Objects used in the application.
 * Used for managing stateful components across the platform.
 */
export const durableObjectsTable = sqliteTable('durable_objects', {
    namespace: text('namespace').notNull(),
    id: text('id').notNull(),

  },
  (table) => [
    uniqueIndex('durable_objects_pk').on(table.namespace, table.id),
  ]
)
// integer('timestamp1', { mode: 'timestamp' })
//     .notNull()
//     .default(sql`((unixepoch()))`),
/**
 * Schedules table that stores information about JingleJam event schedules.
 * Each schedule represents a collection of streams for a specific year.
 * Contains metadata like title, visibility, and ownership information.
 */
export const schedulesTable = sqliteTable('schedules', {
    id: integer().primaryKey({autoIncrement: true}).notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    year: integer('year').notNull(),
    visible: integer({mode: 'boolean'}).notNull(),
    primary: integer({mode: 'boolean'}).notNull().default(false),
    ownerId: integer('owner_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    createdAt: integer('created_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                                )`),
    updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                                )`),
  },
  (table) => [
    // uniqueIndex('one_schedule_per_year_per_user').on(table.ownerId, table.year),
    uniqueIndex('unique_schedule_slug').on(table.slug),
  ]
);

/**
 * Editors table that tracks which users have permission to edit specific schedules.
 * Represents a many-to-many relationship between users and schedules.
 * Used for collaborative schedule management.
 */
export const editorsTable = sqliteTable('editors', {
    scheduleId: integer('schedule_id').references(() => schedulesTable.id, {onDelete: 'cascade'}).notNull(),
    userId: integer('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
  },
  (table) => [
    uniqueIndex('editors_pk').on(table.scheduleId, table.userId),
  ]
);


/**
 * Streams table that stores information about individual streaming events.
 * Each stream belongs to a schedule and has a specific time slot and metadata.
 * Contains details like title, description, and links to VODs.
 */
export const streamsTable = sqliteTable('streams', {
    id: integer('id').notNull(),
    scheduleId: integer('schedule_id').references(() => schedulesTable.id, {onDelete: "cascade"}).notNull(),
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

/**
 * Stream tags table that stores categorization labels for streams.
 * Used for filtering and grouping streams by various attributes.
 * Each stream can have multiple tags.
 */
export const streamTagsTable = sqliteTable('stream_tags', {
    streamId: integer('stream_id').notNull(),
    scheduleId: integer('schedule_id').notNull(),
    tag: text('tag').notNull(),
    label: text('label').notNull(),
    addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch())`),
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

/**
 * Stream participants table that tracks which users are participating in specific streams.
 * Represents a many-to-many relationship between users and streams.
 * Used to display creator information on stream cards and pages.
 */
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


/**
 * Teams table that stores information about creator teams.
 * Teams allow multiple creators to collaborate and organize together.
 * Contains metadata like name, description, and visibility settings.
 */
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

/**
 * Team members table that tracks which users belong to specific teams.
 * Represents a many-to-many relationship between users and teams.
 * Used for team management and displaying team rosters.
 */
export const teamMembersTable = sqliteTable('team_members', {
    teamId: integer('team_id').references(() => teamsTable.id, {onDelete: 'cascade'}).notNull(),
    userId: integer('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
  },
  (table) => [
    uniqueIndex('single_user_per_team').on(table.teamId, table.userId),
  ]
)

/**
 * Team invites table that tracks pending invitations to join teams.
 * Used for team recruitment and membership management.
 * Each record represents an invitation from a team to a user.
 */
export const teamInvitesTable = sqliteTable('team_invites', {
    teamId: integer('team_id').references(() => teamsTable.id, {onDelete: 'cascade'}).notNull(),
    invitedUserId: integer('invite_id').references(() => users.id).notNull(),
  },
  (table) => [
    uniqueIndex('single_invite_per_user_per_team').on(table.teamId, table.invitedUserId),
  ]
)

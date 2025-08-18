import {foreignKey, index, integer, primaryKey, sqliteTable, text, uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
import {users} from './auth-schema.ts';
import {streamsTable} from './jj-schema.ts';

/**
 * Admin-controlled tag system schema for centralized tag management
 * Replaces the old string-based user-generated tag system with admin-managed tags
 */

/**
 * Tag categories table - Organizes tags into logical groups for better management and filtering
 * Provides hierarchical organization with display metadata (colors, icons, sort order)
 * Enables category-based filtering and improves tag discovery in admin interfaces
 */
export const tagCategories = sqliteTable("tag_categories", {
  /** Auto-incrementing primary key */
  id: integer('id').primaryKey({autoIncrement: true}).notNull(),

  /** Unique slug for URL routing and API references */
  slug: text('slug').notNull().unique(),

  /** Display name shown to users */
  name: text('name').notNull(),

  /** Optional description explaining the category */
  description: text('description'),

  /** Color hex code for UI theming */
  color: text('color').notNull().default('#6B7280'),

  /** Category icon identifier */
  icon: text('icon'),

  /** Sort order for category display */
  sortOrder: integer('sort_order').notNull().default(0),

  /** Visibility flag */
  visible: integer('visible', {mode: 'boolean'}).notNull().default(true),

  /** Admin user who created this category */
  createdBy: integer('created_by', {mode: 'number'}).notNull()
    .references(() => users.id, {onDelete: 'cascade'}),

  /** Timestamps */
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('unique_category_slug').on(table.slug),
  index('idx_categories_visible').on(table.visible),
  index('idx_categories_sort_order').on(table.sortOrder),
]);

/**
 * Core tags table - Central repository for all admin-created tags
 * Only admin users can create, update, and delete tags
 */
export const tags = sqliteTable("tags", {
  /** Auto-incrementing primary key for tag identification */
  id: integer('id').primaryKey({autoIncrement: true}).notNull(),

  /** Display name of the tag shown to users */
  name: text('name').notNull(),

  /** URL-friendly slug for routing and unique identification */
  slug: text('slug').notNull().unique(),

  /** Optional description explaining the tag's purpose */
  description: text('description'),

  /** Reference to tag category */
  categoryId: integer('category_id', {mode: 'number'})
    .references(() => tagCategories.id, {onDelete: 'set null'}),

  /** Color hex code for UI theming and visual identification */
  color: text('color').notNull().default('#3584BF'),

  /** Visibility flag - false for draft tags, true for published */
  visible: integer('visible', {mode: 'boolean'}).notNull().default(true),

  /** ID of the admin user who created this tag */
  createdBy: integer('created_by', {mode: 'number'}).notNull()
    .references(() => users.id, {onDelete: 'cascade'}),

  /** Timestamp when the tag was created */
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),

  /** Timestamp when the tag was last updated */
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Unique constraint on slug for URL routing
  uniqueIndex('unique_tag_slug').on(table.slug),
  // Index for filtering by category
  index('idx_tags_category').on(table.categoryId),
  // Index for filtering visible tags
  index('idx_tags_visible').on(table.visible),
  // Index for creator lookups
  index('idx_tags_created_by').on(table.createdBy),
]);

/**
 * Tag aliases table - Multiple aliases per tag for flexible search and migration
 * Supports legacy tag names and alternative spellings/abbreviations
 */
export const tagAliases = sqliteTable("tag_aliases", {
  /** Auto-incrementing primary key for alias identification */
  id: integer('id').primaryKey({autoIncrement: true}).notNull(),

  /** Reference to the canonical tag this alias points to */
  tagId: integer('tag_id', {mode: 'number'}).notNull()
    .references(() => tags.id, {onDelete: 'cascade'}),

  /** The alias text that users can search for */
  alias: text('alias').notNull(),

  /** Timestamp when the alias was created */
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Ensure each alias is unique across the entire system
  uniqueIndex('unique_tag_alias').on(table.alias),
  // Index for efficient tag ID lookups
  index('idx_tag_aliases_tag_id').on(table.tagId),
]);

/**
 * Updated user tags table - Links users to admin-managed tags
 * Replaces the old string-based tag system with references to central tags
 */
export const userTagsTable = sqliteTable("user_tags", {
  /** ID of the user who has this tag */
  userId: integer('user_id', {mode: 'number'}).notNull()
    .references(() => users.id, {onDelete: 'cascade'}),

  /** ID of the tag assigned to this user */
  tagId: integer('tag_id', {mode: 'number'}).notNull()
    .references(() => tags.id, {onDelete: 'cascade'}),

  /** Timestamp when the user added this tag */
  addedAt: integer('added_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Composite primary key prevents duplicate user-tag combinations
  primaryKey({name: 'user_tag_pk', columns: [table.userId, table.tagId]}),
  // Unique index to enforce one-to-one user-tag relationship
  uniqueIndex('unique_user_tag').on(table.userId, table.tagId),
  // Index for efficient tag-based user lookups
  index('idx_user_tags_tag_id').on(table.tagId),
  // Index for efficient user-based tag lookups
  index('idx_user_tags_user_id').on(table.userId),
]);

/**
 * Updated stream tags table - Links streams to admin-managed tags
 * Maintains the complex composite foreign key relationship with streams
 */
export const streamTagsTable = sqliteTable('stream_tags', {
  /** ID of the stream within its schedule */
  streamId: integer('stream_id').notNull(),

  /** ID of the schedule containing the stream */
  scheduleId: integer('schedule_id').notNull(),

  /** ID of the tag assigned to this stream */
  tagId: integer('tag_id', {mode: 'number'}).notNull()
    .references(() => tags.id, {onDelete: 'cascade'}),

  /** Timestamp when the tag was added to the stream */
  addedAt: integer('added_at', {mode: 'timestamp'}).notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Composite primary key prevents duplicate stream-tag combinations
  primaryKey({name: 'stream_tags_pk', columns: [table.scheduleId, table.streamId, table.tagId]}),

  // Foreign key constraint to ensure stream exists
  foreignKey({
    name: 'stream_schedule_fk',
    columns: [table.scheduleId, table.streamId],
    foreignColumns: [streamsTable.scheduleId, streamsTable.id],
  }).onDelete('cascade'),

  // Index for efficient tag-based stream lookups
  index('idx_stream_tags_tag_id').on(table.tagId),
  // Index for efficient stream-based tag lookups
  index('idx_stream_tags_stream').on(table.scheduleId, table.streamId),
  // Index for efficient schedule-based tag lookups
  index('idx_stream_tags_schedule').on(table.scheduleId),
]);

/**
 * Type definitions for TypeScript integration
 * These are automatically generated by Drizzle ORM
 */

// Core tag types
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

// Tag alias types
export type TagAlias = typeof tagAliases.$inferSelect;
export type NewTagAlias = typeof tagAliases.$inferInsert;

// User tag relationship types
export type UserTag = typeof userTagsTable.$inferSelect;
export type NewUserTag = typeof userTagsTable.$inferInsert;

// Stream tag relationship types
export type StreamTag = typeof streamTagsTable.$inferSelect;
export type NewStreamTag = typeof streamTagsTable.$inferInsert;

/**
 * Tag with aliases - for admin management operations
 */
export type TagWithAliases = Tag & {
  aliases: TagAlias[];
};

/**
 * Tag with usage count - for popularity and discovery operations
 */
export type TagWithUsage = Tag & {
  userCount: number;
  streamCount: number;
  totalUsage: number;
};

/**
 * Public tag view - minimal information for public consumption
 */
export type PublicTag = Pick<Tag, 'id' | 'name' | 'slug' | 'description' | 'categoryId' | 'color'>;

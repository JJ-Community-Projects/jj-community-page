// src/lib/db/auth-schema.ts
import {index, integer, primaryKey, sqliteTable, text, uniqueIndex,} from "drizzle-orm/sqlite-core";
import {sql} from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

/**
 * Core users table that stores basic user information and roles.
 * Each user can have multiple accounts (OAuth providers) associated with them.
 */
export const users = sqliteTable("users", {
  id: integer({mode: 'number'}).primaryKey({autoIncrement: true}),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
    .default(sql`((unixepoch())
                 )`),
  role: text('role').$type<"user" | "admin">().notNull().default('user'),
  primaryLiveStream: text('primaryLiveStream').notNull().default('twitch'), // twitch, youtube, tiktok
});

/**
 * Accounts table that stores OAuth provider account information.
 * Each user can have multiple accounts from different providers (Tiltify, Twitch, etc.).
 * The primary key is a combination of userId and provider.
 */
export const accounts =
  sqliteTable("accounts", {
      userId: integer('user_id', {mode: 'number'}).notNull()
        .references(() => users.id, {onDelete: 'cascade'}),
      provider: text('provider').notNull(),
      providerId: text('provider_id').notNull().unique(),
      providerUsername: text("provider_username").notNull(),
      createdAt: integer('created_at', {mode: 'timestamp'})
        .default(sql`((unixepoch())
                     )`).notNull(),
      updatedAt: integer('updated_at', {mode: 'timestamp'})
        .default(sql`((unixepoch())
                     )`).notNull(),
      meta: text('meta', {mode: "json"}),
    },
    (table) => {
      return [
        primaryKey({
          name: 'pk',
          columns: [table.userId, table.provider]
        }),
        uniqueIndex('unique_index_user_id_provider').on(table.userId, table.provider),
        index('index_user_id').on(table.userId),
        index('index_provider_id').on(table.providerId)
      ]
    }
  );

/**
 * Tokens table that stores OAuth access and refresh tokens.
 * Used for authenticating with external services like Tiltify and Twitch.
 * The primary key is a combination of userId and provider.
 */
export const tokens = sqliteTable("tokens", {
    userId: integer('user_id', {mode: 'number'}).notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    provider: text('provider').notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: integer('expires_at', {mode: 'timestamp'}).notNull(),
  },
  (table) => {
    return [
      primaryKey({
        name: 'pk',
        columns: [table.userId, table.provider]
      }),
    ]
  }
)

/**
 * User tags table that stores categorization labels for users.
 * Used for filtering and grouping users by various attributes.
 * Each user can have multiple tags.
 */
export const userTags = sqliteTable("user_tags", {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  tag: text('tag').notNull(),
  label: text('label').notNull(),
  addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                          )`),
}, (table) => [
  primaryKey({name: 'user_tag_pk', columns: [table.userId, table.tag]}),
  uniqueIndex('unique_user_tag').on(table.userId, table.tag)
])


/**
 * User socials table that stores links to users' social media profiles.
 * Each user can have multiple social media links (Twitch, Twitter, etc.).
 * The primary key is a combination of userId and provider.
 */
export const userSocials = sqliteTable("user_socials", {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  provider: text('social').notNull(), // e.g. twitch, twitter, bsky, etc.
  url: text('url').notNull()
}, (table) => [
  primaryKey({name: 'user_url_provider_pk', columns: [table.userId, table.provider]}),
  uniqueIndex('unique_user_url_provider').on(table.userId, table.provider)
])

/**
 * Blocked accounts table that stores information about accounts that are blocked from the platform.
 * Used for moderation and security purposes.
 * References the accounts table by providerId.
 */
export const blockedAccounts = sqliteTable("blocked_accounts", {
  providerId: text('provider_id').notNull().notNull().references(() => accounts.providerId, {onDelete: 'cascade'}),
  provider: text('provider').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', {mode: 'timestamp'})
    .default(sql`((unixepoch())
                 )`).notNull(),
})

/**
 * User styles table that stores customization preferences for user profiles.
 * Contains color settings that affect how a user's profile and content are displayed.
 * Each user can have only one style record.
 */
export const userStyles = sqliteTable("user_styles", {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  primaryColor: text('primary_color').notNull().default('#E30E50'),
  accentColor: text('accent_color').notNull().default('#3584BF'),
}, (table) => [
  primaryKey({name: 'user_style_pk', columns: [table.userId]}),
])

/**
 * Friend requests table that tracks pending friend connections between users.
 * Stores the user who sent the request (fromUserId) and the recipient (toUserId).
 * Used to manage the social network aspect of the platform.
 */
export const friendRequests = sqliteTable("friend_requests", {
  fromUserId: integer('from_user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  toUserId: integer('to_user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => [
  uniqueIndex('unique_friend_requests', ).on(table.fromUserId, table.toUserId)
])

/**
 * Friends table that stores established connections between users.
 * Created when a friend request is accepted.
 * Represents the social graph of the platform.
 */
export const friendsTable = sqliteTable("friends", {
  fromUserId: integer('from_user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  toUserId: integer('to_user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => [
  uniqueIndex('unique_friends', ).on(table.fromUserId, table.toUserId)
])

/**
 * Blocked users table that tracks which users have blocked other users.
 * Used for privacy and moderation features.
 * Prevents unwanted interactions between users.
 */
export const blockedUsers = sqliteTable("blocked_users", {
  userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  blockedUser: integer('blocked_user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
}, (table) => [
  uniqueIndex('unique_blocked_user', ).on(table.userId, table.blockedUser)
])

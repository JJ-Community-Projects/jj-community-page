import {index, integer, primaryKey, sqliteTable, text, uniqueIndex,} from "drizzle-orm/sqlite-core";
import {sql} from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer({mode: 'number'}).primaryKey({autoIncrement: true}),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
    .default(sql`((unixepoch())
                 )`),
  role: text('role').$type<"user" | "admin">().notNull().default('user'),
  primaryLiveStream: text('primaryLiveStream').notNull().default('twitch'), // twitch, youtube, tiktok
});

export const accounts =
  sqliteTable("accounts", {
      userId: integer({mode: 'number'}).notNull()
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

export const tokens = sqliteTable("tokens", {
    userId: integer({mode: 'number'}).notNull()
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

export const userTags = sqliteTable("user_tags", {
  userId: integer({mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  tag: text('tag').notNull(),
  label: text('label').notNull(),
  addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                          )`),
}, (table) => [
  primaryKey({name: 'user_tag_pk', columns: [table.userId, table.tag]}),
  uniqueIndex('unique_user_tag').on(table.userId, table.tag)
])

export const userSocials = sqliteTable("user_socials", {
  userId: integer({mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  provider: text('social').notNull(), // e.g. twitch, twitter, bsky
  url: text('url').notNull()
}, (table) => [
  primaryKey({name: 'user_url_provider_pk', columns: [table.userId, table.provider]}),
  uniqueIndex('unique_user_url_provider').on(table.userId, table.provider)
])

export const blockedAccounts = sqliteTable("blocked_accounts", {
  providerId: text('provider_id').notNull().notNull().references(() => accounts.providerId, {onDelete: 'cascade'}),
  provider: text('provider').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', {mode: 'timestamp'})
    .default(sql`((unixepoch())
                 )`).notNull(),
})

export const userStyles = sqliteTable("user_styles", {
  userId: integer({mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
  primaryColor: text('primary_color').notNull().default('#E30E50'),
  accentColor: text('accent_color').notNull().default('#3584BF'),
}, (table) => [
  primaryKey({name: 'user_style_pk', columns: [table.userId]}),
])

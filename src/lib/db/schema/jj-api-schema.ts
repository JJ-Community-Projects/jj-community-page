import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const jjCampaign = sqliteTable(
  'jj_campaign',
  {
    year: integer().notNull(),
    causeId: integer('cause_id'),
    name: text('name').notNull(),
    description: text('description'),
    slug: text('slug').notNull(),
    url: text('url'),
    startTime: text('start_time').notNull(), // ISO string
    raised: real('raised').notNull(),
    goal: real('goal').notNull(),
    livestream: text('livestream', { mode: 'json' }).$type<{
      channel: string
      type: string
    }>(),

    userId: integer('user_id'),
    userName: text('user_name'),
    userSlug: text('user_slug'),
    userAvatar: text('user_avatar'),
    userUrl: text('user_url'),
  },
  (table) => [
    primaryKey({ name: 'pk', columns: [table.userSlug, table.year] }),
  ],
)

export const jjCauses = sqliteTable(
  'jj_causes',
  {
    year: integer('year').notNull(),
    id: integer('id').primaryKey(), // 1227
    name: text('name').notNull(),
    logo: text('logo'),
    description: text('description'),
    url: text('url'),
    donateUrl: text('donate_url'),
    // raised: json<{ yogscast: number; fundraisers: number }>()('raised').notNull(),
    raised: text('raised', { mode: 'json' }).$type<{
      yogscast: number
      fundraisers: number
    }>(),
  },
  (table) => [primaryKey({ name: 'pk', columns: [table.id, table.year] })],
)

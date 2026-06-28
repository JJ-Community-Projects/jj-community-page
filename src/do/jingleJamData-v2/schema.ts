// SQLite DDL + column lists + parameterized statements for the v2 DO store.
//
// Two relational tables (`cause`, `campaign`) plus a tiny key/value `meta`
// table live in `ctx.storage.sql`. Everything the DO owns about campaigns and
// causes is one row per entity; twitch/live/goal fields are denormalized onto
// the campaign row so projections need no joins.

// --- Row shapes (snake_case, mirror the DB columns) ---
export interface CauseRow {
  id: string
  year: number | null
  name: string
  logo: string
  description: string
  url: string
  donate_url: string
  raised: number
}

export interface CampaignRow {
  id: string
  year: number | null
  slug: string
  user_slug: string
  cause_id: string | null
  name: string
  description: string
  url: string
  start_time: string | null
  raised: number
  goal: number
  previous_goal: number
  user_name: string
  user_avatar: string
  user_url: string
  twitch_login: string
  twitch_id: string
  twitch_name: string
  twitch_avatar: string
  is_live: number
  youtube_url: string | null
}

// Columns written by the campaign ingest (raw JJ-API fields + goal diff).
// twitch_*/is_live/youtube_url are owned by the social/validate/live tasks and
// are intentionally NOT touched on an ingest upsert so their last-known values
// survive.
export const CAMPAIGN_INGEST_COLUMNS = [
  'id',
  'year',
  'slug',
  'user_slug',
  'cause_id',
  'name',
  'description',
  'url',
  'start_time',
  'raised',
  'goal',
  'previous_goal',
  'user_name',
  'user_avatar',
  'user_url',
] as const

export const CAUSE_COLUMNS = [
  'id',
  'year',
  'name',
  'logo',
  'description',
  'url',
  'donate_url',
  'raised',
] as const

export const CREATE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS cause (
    id TEXT PRIMARY KEY,
    year INTEGER,
    name TEXT,
    logo TEXT,
    description TEXT,
    url TEXT,
    donate_url TEXT,
    raised REAL
  )`,
  `CREATE TABLE IF NOT EXISTS campaign (
    id TEXT PRIMARY KEY,
    year INTEGER,
    slug TEXT,
    user_slug TEXT,
    cause_id TEXT,
    name TEXT,
    description TEXT,
    url TEXT,
    start_time TEXT,
    raised REAL,
    goal REAL,
    previous_goal REAL,
    user_name TEXT,
    user_avatar TEXT,
    user_url TEXT,
    twitch_login TEXT NOT NULL DEFAULT '',
    twitch_id TEXT NOT NULL DEFAULT '',
    twitch_name TEXT NOT NULL DEFAULT '',
    twitch_avatar TEXT NOT NULL DEFAULT '',
    is_live INTEGER NOT NULL DEFAULT 0,
    youtube_url TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS campaign_slug ON campaign(slug)`,
  `CREATE INDEX IF NOT EXISTS campaign_user_slug ON campaign(user_slug)`,
  `CREATE INDEX IF NOT EXISTS campaign_twitch_id ON campaign(twitch_id)`,
  `CREATE INDEX IF NOT EXISTS campaign_twitch_login ON campaign(twitch_login)`,
  `CREATE INDEX IF NOT EXISTS campaign_cause ON campaign(cause_id)`,
  `CREATE INDEX IF NOT EXISTS campaign_raised ON campaign(raised DESC)`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
]

// Idempotent table + index creation. Safe to call on every cold start.
export function init(sql: SqlStorage) {
  for (const ddl of CREATE_TABLES) sql.exec(ddl)
}

// Upsert one campaign's ingest-owned columns, preserving twitch/live/youtube.
export const UPSERT_CAMPAIGN = `
  INSERT INTO campaign (
    id, year, slug, user_slug, cause_id, name, description, url, start_time,
    raised, goal, previous_goal, user_name, user_avatar, user_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    year = excluded.year,
    slug = excluded.slug,
    user_slug = excluded.user_slug,
    cause_id = excluded.cause_id,
    name = excluded.name,
    description = excluded.description,
    url = excluded.url,
    start_time = excluded.start_time,
    raised = excluded.raised,
    goal = excluded.goal,
    previous_goal = excluded.previous_goal,
    user_name = excluded.user_name,
    user_avatar = excluded.user_avatar,
    user_url = excluded.user_url
`

export const UPSERT_CAUSE = `
  INSERT INTO cause (id, year, name, logo, description, url, donate_url, raised)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    year = excluded.year,
    name = excluded.name,
    logo = excluded.logo,
    description = excluded.description,
    url = excluded.url,
    donate_url = excluded.donate_url,
    raised = excluded.raised
`

export const SET_META = `
  INSERT INTO meta (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`

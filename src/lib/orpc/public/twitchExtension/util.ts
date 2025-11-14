import type { JJDrizzleDatabase } from '../../../db/db.ts'
import { twitchChannelSchema } from '../../../db/schema/twitch-channel-schema.ts'
import { and, eq, sql } from 'drizzle-orm'
import type {
  CurrenciesTV,
  JJCampaignTVType,
  JJCauseTVType,
} from './contract.ts'
import type { UserDisplay } from '../schemas/UserDisplaySchema.ts'
import { jjCampaign } from '../../../db/schema/jj-api-schema.ts'
import { ORPCError } from '@orpc/server'
import { TwitchAPI } from '../../../twitchAPI.ts'
import { tiltifyMetadataView } from '../../../db/schema/views-schema.ts'

export async function getUserIdByTwitchChannelId(
  db: JJDrizzleDatabase,
  channelId: string,
) {
  const channel = await db
    .select({ userId: twitchChannelSchema.userId })
    .from(twitchChannelSchema)
    .where(eq(twitchChannelSchema.id, channelId))
    .get()
  return channel?.userId
}
export async function getTiltifySlugByTwitchChannelId(
  db: JJDrizzleDatabase,
  channelId: string,
) {
  const userId = await getUserIdByTwitchChannelId(db, channelId)
  if (!userId)
    return {
      slug: undefined,
      userId: undefined,
    }
  const tiltify = await db
    .select({ slug: tiltifyMetadataView.slug })
    .from(tiltifyMetadataView)
    .where(eq(tiltifyMetadataView.userId, userId))
    .get()
  return {
    slug: tiltify?.slug,
    userId: userId,
  }
}

// JSON stringify that preserves Date fields by converting them to ISO strings
function stringifyWithDates(value: unknown) {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) {
      return val.toISOString()
    }
    return val as any
  })
}

async function putJSON(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number = 60,
) {
  await kv.put(key, stringifyWithDates(value), { expirationTtl: ttlSeconds })
}

function makeKey(channelId: string, name: string) {
  return `twitch-extension:${channelId}:${name}`
}

// --- Twitch Extension KV storage helpers ---
// Each function stores the corresponding procedure result to KV with a sensible namespaced key.
// ttlSeconds defaults to 60 as required.

// Types that mirror the Twitch Extension contract outputs
export type ExtensionConfig = {
  year: number
  showYogsSchedule: boolean
  showCharities: boolean
  showFundraisers: boolean
  refreshInterval: {
    yogsSchedule: number
    charities: number
    fundraisers: number
  }
  donationLink: {
    url: string
    visible: boolean
    text: string
  }
  donationTrackerUrl: string
  timestamp: string
}

export type CreatorType = {
  id: string
  name: string
  url: string
  imageUrl?: string
  color: string
}

export type StreamType = {
  title: string
  subtitle?: string
  description?: string
  markdownDescription?: string
  start: Date
  end: Date
  creators?: CreatorType[]
  vods?: { label?: string; link: string }[]
  color: string
}

export type YogsScheduleOutput = {
  title: string
  start: Date
  end: Date
  initialDayIndex: number
  days: Array<{
    start: Date
    end: Date
    streams: StreamType[]
  }>
  streams: StreamType[]
}

export type CampaignsOutput = { count: number; list: JJCampaignTVType[] }
export type CausesOutput = { count: number; list: JJCauseTVType[] }
export type UserScheduleOutput = {
  title: string
  start: Date
  end: Date
  streams: StreamType[]
}
export type UserRelationsOutput = { friends: UserDisplay[] }
export type UserRelatedScheduleOutput = { teams: { streams: StreamType[] } }

export type OverviewOutput = {
  raised: {
    yogscast?: CurrenciesTV
    fundraisers?: CurrenciesTV
    total: CurrenciesTV
  }
  // Type of collections comes from DO; keep it generic to avoid tight coupling
  collections: any
  donations: number
  date: Date
}

export type UserExtensionTab =
  | 'user-schedule'
  | 'charities'
  | 'fundraisers'
  | 'yogs'

export type UserExtensionConfigOutput = {
  hasCampaign: boolean
  hasSchedule: boolean
  tabs: UserExtensionTab[]
}

export async function storeExtensionConfig(
  kv: KVNamespace,
  channelId: string,
  data: ExtensionConfig,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'config'), data, ttlSeconds)
}

export async function storeCampaigns(
  kv: KVNamespace,
  channelId: string,
  data: CampaignsOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'campaigns'), data, ttlSeconds)
}

export async function storeCauses(
  kv: KVNamespace,
  channelId: string,
  data: CausesOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'causes'), data, ttlSeconds)
}

export async function storeCause(
  kv: KVNamespace,
  data: JJCauseTVType,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(`${data.id}`, 'causes'), data, ttlSeconds)
}

export async function storeOverview(
  kv: KVNamespace,
  data: OverviewOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, 'twitch-extension:overview', data, ttlSeconds)
}

export async function storeYogsSchedule(
  kv: KVNamespace,
  data: YogsScheduleOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, 'twitch-extension:yogs-schedule', data, ttlSeconds)
}

export async function storeUserData(
  kv: KVNamespace,
  channelId: string,
  data: JJCampaignTVType,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'user-data'), data, ttlSeconds)
}

export async function storeUserSchedule(
  kv: KVNamespace,
  channelId: string,
  data: UserScheduleOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'user-schedule'), data, ttlSeconds)
}

export async function storeUserRelations(
  kv: KVNamespace,
  channelId: string,
  data: UserRelationsOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'user-relations'), data, ttlSeconds)
}

export async function storeUserRelatedSchedule(
  kv: KVNamespace,
  channelId: string,
  data: UserRelatedScheduleOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(
    kv,
    makeKey(channelId, 'user-related-schedule'),
    data,
    ttlSeconds,
  )
}

export async function storeUserExtensionConfig(
  kv: KVNamespace,
  channelId: string,
  data: UserExtensionConfigOutput,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, makeKey(channelId, 'user-config'), data, ttlSeconds)
}

// --- Load helpers (KV -> typed outputs) ---

async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function reviveStreamDates<T extends { start: any; end: any }>(
  s: T,
): T & {
  start: Date
  end: Date
} {
  return {
    ...(s as any),
    start: new Date((s as any).start),
    end: new Date((s as any).end),
  }
}

function reviveStreams(list: any[] | undefined): StreamType[] {
  if (!Array.isArray(list)) return []
  return list.map((s) => reviveStreamDates(s)) as StreamType[]
}

export async function loadExtensionConfig(
  kv: KVNamespace,
  channelId: string,
): Promise<ExtensionConfig | null> {
  return getJSON<ExtensionConfig>(kv, makeKey(channelId, 'config'))
}

export async function loadCampaigns(
  kv: KVNamespace,
  channelId: string,
): Promise<CampaignsOutput | null> {
  return getJSON<CampaignsOutput>(kv, makeKey(channelId, 'campaigns'))
}

export async function loadCauses(
  kv: KVNamespace,
  channelId: string,
): Promise<CausesOutput | null> {
  return getJSON<CausesOutput>(kv, makeKey(channelId, 'causes'))
}
export async function loadCause(
  kv: KVNamespace,
  causeId: string,
): Promise<JJCauseTVType | null> {
  return getJSON<JJCauseTVType>(kv, makeKey(`${causeId}`, 'causes'))
}

export async function loadOverview(
  kv: KVNamespace,
): Promise<OverviewOutput | null> {
  const data = await getJSON<any>(kv, 'twitch-extension:overview')
  if (!data) return null
  const revived: OverviewOutput = {
    raised: data.raised,
    collections: data.collections,
    donations: Number(data.donations ?? 0),
    date: new Date(data.date),
  }
  return revived
}

export async function loadYogsSchedule(
  kv: KVNamespace,
): Promise<YogsScheduleOutput | null> {
  const data = await getJSON<any>(kv, 'twitch-extension:yogs-schedule')
  if (!data) return null
  const revivedDays = Array.isArray(data.days)
    ? data.days.map((d: any) => ({
        start: new Date(d.start),
        end: new Date(d.end),
        streams: reviveStreams(d.streams),
      }))
    : []
  const revived: YogsScheduleOutput = {
    title: data.title,
    start: new Date(data.start),
    end: new Date(data.end),
    initialDayIndex: Number(data.initialDayIndex ?? 0),
    days: revivedDays,
    streams: reviveStreams(data.streams),
  }
  return revived
}

export async function loadUserData(
  kv: KVNamespace,
  channelId: string,
): Promise<JJCampaignTVType | null> {
  // JJCampaignType.startTime is a string per contract; do not convert
  return getJSON<JJCampaignTVType>(kv, makeKey(channelId, 'user-data'))
}

export async function loadUserSchedule(
  kv: KVNamespace,
  channelId: string,
): Promise<UserScheduleOutput | null> {
  const data = await getJSON<any>(kv, makeKey(channelId, 'user-schedule'))
  if (!data) return null
  const revived: UserScheduleOutput = {
    title: data.title,
    start: new Date(data.start),
    end: new Date(data.end),
    streams: reviveStreams(data.streams),
  }
  return revived
}

export async function loadUserRelations(
  kv: KVNamespace,
  channelId: string,
): Promise<UserRelationsOutput | null> {
  return getJSON<UserRelationsOutput>(kv, makeKey(channelId, 'user-relations'))
}

export async function loadUserRelatedSchedule(
  kv: KVNamespace,
  channelId: string,
): Promise<UserRelatedScheduleOutput | null> {
  const data = await getJSON<any>(
    kv,
    makeKey(channelId, 'user-related-schedule'),
  )
  if (!data) return null
  const revived: UserRelatedScheduleOutput = {
    teams: {
      streams: reviveStreams(data.teams?.streams),
    },
  }
  return revived
}

export async function loadUserExtensionConfig(
  kv: KVNamespace,
  channelId: string,
): Promise<UserExtensionConfigOutput | null> {
  return getJSON<UserExtensionConfigOutput>(
    kv,
    makeKey(channelId, 'user-config'),
  )
}

export async function getCampaignByTwitchChannelId(
  channelId: string,
  env: Env,
  db: JJDrizzleDatabase,
) {
  // find twitch channel
  const { slug, userId } = await getTiltifySlugByTwitchChannelId(db, channelId)

  const ConfigDO = env!.ConfigDO
  const stub = ConfigDO.get(ConfigDO.idFromName('ConfigDO'))
  const year =
    (await stub.getNumberConfig('twitch-extension:config.year')) ??
    new Date().getUTCFullYear()

  if (slug) {
    const camp = await db
      .select()
      .from(jjCampaign)
      .where(and(eq(jjCampaign.slug, slug), eq(jjCampaign.year, year)))
      .get()

    return {
      camp,
      userId,
    }
  }

  const twitchAPI = new TwitchAPI(env)

  const { data, error } = await twitchAPI.fetchUserByIdWithCache(channelId)

  if (error) {
    console.error('twitch error', error)
    // Map 404 to NOT_FOUND; others to INTERNAL_SERVER_ERROR
    if (error.status === 404) {
      throw new ORPCError('NOT_FOUND', { message: 'Twitch user not found' })
    }
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: error.description ?? 'Error fetching Twitch user',
    })
  }

  if (!data) {
    // Shouldn’t happen after the above, but keep as safety
    throw new ORPCError('NOT_FOUND', { message: 'Twitch user not found' })
  }

  console.log('twitch user', data)

  const camp = await db
    .select()
    .from(jjCampaign)
    .where(
      and(
        eq(
          sql<string>`json_extract(${jjCampaign.livestream}, '$.channel')`,
          data.login,
        ),
        eq(
          sql<string>`json_extract(${jjCampaign.livestream}, '$.type')`,
          'twitch',
        ),
        eq(jjCampaign.year, year),
      ),
    )
    .get()

  return {
    camp,
    userId,
  }
}

export function valueToCurrencies(
  value: number,
  usdConversionRate: number,
  eurConversionRate: number,
): CurrenciesTV {
  const GBP = Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  })
  const USD = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  const EUR = Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  })
  const usd = parseFloat((value * usdConversionRate).toFixed(2))
  const euro = parseFloat((value * eurConversionRate).toFixed(2))
  return {
    gbp: value,
    usd: usd,
    euro: euro,
    gbpFormatted: GBP.format(value),
    usdFormatted: USD.format(usd),
    euroFormatted: EUR.format(euro),
  }
}

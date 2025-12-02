import type { JJDrizzleDatabase } from '../../../db/db.ts'
import { twitchChannelSchema } from '../../../db/schema/twitch-channel-schema.ts'
import { and, eq, sql } from 'drizzle-orm'
import {
  type CurrenciesTV,
  type JJCampaignTVType,
  type JJCauseTVType,
  type StreamTVType,
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
export async function storeChannelOverview(
  kv: KVNamespace,
  data: OverviewOutput,
  channelId: string,
  ttlSeconds: number = 60,
) {
  return putJSON(kv, `twitch-extension:overview:${channelId}`, data, ttlSeconds)
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
export async function loadChannelOverview(
  kv: KVNamespace,
  channelId: string,
): Promise<OverviewOutput | null> {
  const data = await getJSON<any>(kv, `twitch-extension:overview:${channelId}`)
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

export async function getHardCodedEventsNoYogsForExtension(): Promise<
  StreamTVType[]
> {
  const week1: StreamTVType[] = [
    {
      title: 'JACK MANIFOLD 24 hours of non-stop action',
      subtitle: 'Headliner',
      description:
        'Tune in for a full 24 hours of non-stop action with the master of the long stream. Expect everything from chaotic IRL segments and party games to loads more.',
      start: new Date('2025-12-02T18:00:00.000Z'),
      end: new Date('2025-12-03T18:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'jackmanifoldtv',
          name: 'JackManifoldTV',
          url: 'https://twitch.tv/jackmanifoldtv',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/f7bfa0ca-e9ec-4ca6-935a-a9b6c5c8f651-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'JEN AND ALIONA',
      subtitle: 'Headliner',
      description:
        'Join Clair Obscur: Expedition 33 stars Jennifer English and Aliona Baranova as they carve a path to the Monolith to fight the Paintress!',
      start: new Date('2025-12-02T19:00:00.000Z'),
      end: new Date('2025-12-02T22:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'jenandaliona',
          name: 'JenandAliona',
          url: 'https://twitch.tv/jenandaliona',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/46d24a55-a2a1-47b9-89c8-8446e69657fc-profile_image-70x70.png',
        },
      ],
    },
    /*
    {
      title: 'LITTLEBUNNY_X',
      subtitle: 'Wild games and cooking streams',
      description:
        'Support Bunny as she takes on a variety of wild games on 2nd December and check back in throughout the two weeks for cooking streams and special guests!',
      start: new Date('2025-12-02T11:00:00.000Z'),
      end: new Date('2025-12-02T13:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'littlebunny_x',
          name: 'littlebunny_x',
          url: 'https://twitch.tv/littlebunny_x',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/de635b64-2eaf-4a2e-8704-02c74d0c1ea4-profile_image-70x70.png',
        },
      ],
    },*/
    {
      title: 'NAKED & AFRAID',
      subtitle: 'Headline',
      description:
        '21 seasoned Minecraft pros take on the hardest survival challenge on the internet, with one life and no hope.',
      start: new Date('2025-12-02T14:00:00.000Z'),
      end: new Date('2025-12-02T16:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'shubble',
          name: 'shubble',
          url: 'https://twitch.tv/shubble',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/a2c21c36-d5fa-4c47-a1ef-ea0e4eb6cfbe-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'NAKED & AFRAID',
      subtitle: 'Headline',
      description:
        '21 seasoned Minecraft pros take on the hardest survival challenge on the internet, with one life and no hope.',
      start: new Date('2025-12-04T14:00:00.000Z'),
      end: new Date('2025-12-04T16:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'REKRAP22',
          name: 'REKRAP22',
          url: 'https://twitch.tv/REKRAP22',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/5efe4026-499c-4b67-bcf6-eee1021ca735-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'NAKED & AFRAID',
      subtitle: 'Headline',
      description:
        '21 seasoned Minecraft pros take on the hardest survival challenge on the internet, with one life and no hope.',
      start: new Date('2025-12-06T14:00:00.000Z'),
      end: new Date('2025-12-06T16:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'CLOWNPIERCE',
          name: 'CLOWNPIERCE',
          url: 'https://twitch.tv/CLOWNPIERCE',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/45e12999-67cc-4217-8a18-c8f750bca3cf-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'ZEALAND',
      subtitle: "Headliner",
      description:
        "Join Zealand as he takes on his Football Manager '26 'Charity-O-Thon' save trying to win the championship with a team linked to War Child. But what team will he choose?",
      start: new Date('2025-12-07T16:00:00.000Z'),
      end: new Date('2025-12-07T18:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'zeaiand',
          name: 'Zealand',
          url: 'https://twitch.tv/zeaiand',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/97eab8e6-7c73-4c57-8982-03af8a0d83df-profile_image-70x70.png',
        },
      ],
    },
    /*
    {
      title: "WAR CHILD'S QUIZ OF THE YEAR",
      subtitle: undefined,
      description:
        "War Child's Quiz of the Year returns! Join the stream and play-along with their creator contestants as they battle it out to be named quiz champion.",
      start: new Date('2025-12-03T20:00:00.000Z'),
      end: new Date('2025-12-03T22:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'warchildukgaming',
          name: 'WarChildUKGaming',
          url: 'https://twitch.tv/warchildukgaming',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/f80cf57e-714f-438f-8041-6cfbb3381fc3-profile_image-70x70.jpg',
        },
      ],
    },*/
    /*
    {
      title: 'ARTHURTV',
      subtitle: 'Planet Zoo and guests',
      description:
        'Join Arthur for a evening of wildlife fun including Planet Zoo and maybe even some special guests!',
      start: new Date('2025-12-03T18:00:00.000Z'),
      end: new Date('2025-12-03T20:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'arthurtv',
          name: 'arthurtv',
          url: 'https://twitch.tv/arthurtv',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/dc49b1e8-16f3-400c-b57c-bd5546e5f79e-profile_image-70x70.png',
        },
      ],
    },*/
    {
      title: 'TALIA MAR 12-hour streaming marathon',
      subtitle: 'Headliner',
      description:
        "Back for her second Jingle Jam, join Talia for a 12-hour streaming marathon! She's bringing nonstop music, hilarious games, and a full day of charity goodness.",
      start: new Date('2025-12-04T10:00:00.000Z'),
      end: new Date('2025-12-04T22:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'TaliaMar',
          name: 'taliamar',
          url: 'https://twitch.tv/TaliaMar',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/05a2f862-6ea4-4e31-901f-0ff846d173eb-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'JUST ANOTHER MINECRAFT SERVER (JAMS)',
      subtitle: 'Headliner',
      description:
        'Chaotic 100 creator Minecraft SMP featuring a race to complete a series of 9 collaborative quests whilst also avoiding the mayhem caused by the various donation incentives.',
      start: new Date('2025-12-05T21:00:00.000Z'),
      end: new Date('2025-12-05T23:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'jojosolos',
          name: 'jojosolos',
          url: 'https://twitch.tv/jojosolos',
          color: '#3584BF',
          imageUrl:'https://static-cdn.jtvnw.net/jtv_user_pictures/b4f58c1c-7a8c-41bb-9f4e-5f5d4af2f836-profile_image-70x70.png'
        },
      ],
    },
    {
      title: 'JUST CREATE SMP WEEKENDER',
      subtitle: 'Headliner',
      description: '',
      start: new Date('2025-12-06T10:00:00.000Z'),
      end: new Date('2025-12-06T20:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'FOXYNOTAIL',
          name: 'FOXYNOTAIL',
          url: 'https://twitch.tv/FOXYNOTAIL',
          color: '#3584BF',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/6b51aaed-e715-44a4-b492-2b0272913f45-profile_image-70x70.png',
        },
      ],
    },
    {
      title: 'Medival Rust Armada',
      subtitle: 'Headliner',
      description: '',
      start: new Date('2025-12-04T19:00:00.000Z'),
      end: new Date('2025-12-04T22:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'JACKSHEPARDTV',
          name: 'JACKSHEPARDTV',
          url: 'https://twitch.tv/JACKSHEPARDTV',
          color: '#E30E50',
          imageUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/fe33f2df-837d-478a-a853-277cd319f963-profile_image-70x70.png'
        },
      ],
    },
    {
      title: 'HIGH ROLLERS DND',
      subtitle: 'Headliner',
      description:
        "The High Rollers crew return for another unforgettable DnD one-shot. Prepare for chaos - where they end up is anyone's guess!",
      start: new Date('2025-12-07T17:00:00.000Z'),
      end: new Date('2025-12-07T20:00:00.000Z'),
      color: '#E30E50',
      creators: [
        {
          id: 'highrollersdnd',
          name: 'highrollersdnd',
          url: 'https://twitch.tv/highrollersdnd',
          color: '#E30E50',
          imageUrl:
            'https://static-cdn.jtvnw.net/jtv_user_pictures/9005fcb8-2b5a-4c86-a625-e865a816f5cd-profile_image-70x70.png',
        },
      ],
    },
  ]

  const allEvents = [...week1]

  return allEvents
}

import { getDB } from '../../lib/db/db.ts'
import { and, asc, desc, eq } from 'drizzle-orm'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
} from '../../lib/db/schema/jj-schema.ts'
import {
  tagUserCountsView,
  userDisplayView,
} from '../../lib/db/schema/views-schema.ts'
import { streamTagsTable, tags, userTagsTable } from '../../lib/db/schema/tags-schema.ts'
import { accounts } from '../../lib/db/schema/auth-schema.ts'
import { TiltifyAPI } from '../../lib/TiltifyAPI.ts'
import { TwitchAPI } from '../../lib/twitchAPI.ts'
import {
  normalizeTwitchLogin,
  tiltifySlugToTwitchLoginMap,
} from '../utils/twitchLogins.ts'
import { chunk } from '../utils/chunk.ts'
import type {
  FullCommunitySchedule,
  Stream,
  UserDisplay,
  UserStream,
} from '../../lib/orpc/private/jjData/contract.ts'
import type { UserWithTags } from './projections.ts'
import { JJDashboardAPI } from './sources/JJDashboardAPI.ts'
import { FxSource } from './sources/FxSource.ts'
import type { Store, SocialUpdate, TwitchResolved } from './Store.ts'

export interface TaskContext {
  store: Store
  env: Env
}

export interface TaskDef {
  name: string
  everyMs: number
  // Name of a task that must have succeeded this cycle for this one to run.
  dependsOn?: string
  // Per-task wall-clock timeout; defaults to DEFAULT_TASK_TIMEOUT_MS.
  timeoutMs?: number
  run: (ctx: TaskContext) => Promise<void>
}

export const DEFAULT_TASK_TIMEOUT_MS = 60_000

const SOCIAL_CONCURRENCY = 8

// Run `fn` over `items` with a bounded number of in-flight promises.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

// =============================== Tasks ===============================

const ingestEvent: TaskDef = {
  name: 'ingestEvent',
  everyMs: 60 * 1000,
  run: async ({ store, env }) => {
    const api = new JJDashboardAPI(env.JJ_DASHBOARD_URL)
    const data = await api.fetchEvent()
    store.upsertEvent(data.causes, {
      date: data.date,
      year: data.event.year,
      raised: data.raised,
      collections: data.collections,
      donations: data.donations,
      usdRate: data.dollarConversionRate,
    })
  },
}

const ingestCampaigns: TaskDef = {
  name: 'ingestCampaigns',
  everyMs: 60 * 1000,
  run: async ({ store, env }) => {
    const api = new JJDashboardAPI(env.JJ_DASHBOARD_URL)
    const campaigns = await api.fetchAllCampaigns()
    if (campaigns.length === 0) return
    store.upsertCampaigns(campaigns, store.getYear())
  },
}

const checkLive: TaskDef = {
  name: 'checkLive',
  everyMs: 3 * 60 * 1000,
  dependsOn: 'ingestCampaigns',
  run: async ({ store, env }) => {
    const logins = store.getValidTwitchLogins()
    if (logins.length === 0) return
    const api = new TwitchAPI(env)
    const accessToken = await api.getAppToken()
    if (!accessToken) {
      // No token: keep last-known live flags rather than zeroing them.
      console.error('checkLive', 'no twitch token')
      return
    }
    const liveLogins: string[] = []
    for (const group of chunk(logins, 50)) {
      const stream = await api.fetchStreamsByLogins(group, accessToken)
      if (stream.data && !stream.error) {
        for (const s of stream.data) liveLogins.push(s.user_login)
      }
    }
    store.setLive(liveLogins)
  },
}

const fetchFX: TaskDef = {
  name: 'fetchFX',
  everyMs: 4 * 60 * 60 * 1000,
  run: async ({ store }) => {
    const rate = await new FxSource().fetchGbpToEur()
    if (rate != null) store.setGbpToEur(rate)
  },
}

const syncSocials: TaskDef = {
  name: 'syncSocials',
  everyMs: 3 * 60 * 60 * 1000,
  dependsOn: 'ingestCampaigns',
  timeoutMs: 5 * 60 * 1000,
  run: async ({ store, env }) => {
    const rows = store.campaignRowsForTasks()
    if (rows.length === 0) return
    const api = new TiltifyAPI(env)
    const token = await api.getAppToken()
    if (!token) {
      console.error('syncSocials', 'no tiltify token')
      return
    }
    const updates = await mapWithConcurrency(
      rows,
      SOCIAL_CONCURRENCY,
      async (row): Promise<SocialUpdate> => {
        const res = await api.getUserBySlug(row.user_slug, token)
        const social = res?.data.social
        const rawTwitch =
          tiltifySlugToTwitchLoginMap.get(row.user_slug) ?? social?.twitch
        const twitchLogin = rawTwitch ? normalizeTwitchLogin(rawTwitch) : ''
        const youtubeUrl = social?.youtube ?? null
        return { id: row.id, twitchLogin, youtubeUrl }
      },
    )
    store.setSocials(updates)
  },
}

const validateTwitch: TaskDef = {
  name: 'validateTwitch',
  everyMs: 6 * 60 * 60 * 1000,
  dependsOn: 'syncSocials',
  timeoutMs: 5 * 60 * 1000,
  run: async ({ store, env }) => {
    const logins = Array.from(
      new Set(
        store
          .campaignRowsForTasks()
          .map((r) => r.twitch_login)
          .filter((l) => l !== ''),
      ),
    )
    if (logins.length === 0) return
    const api = new TwitchAPI(env)
    const accessToken = await api.getAppToken()
    if (!accessToken) {
      console.error('validateTwitch', 'no twitch token')
      return
    }
    const resolved: TwitchResolved[] = []
    const invalid: string[] = []
    for (const login of logins) {
      const channel = await api.fetchUsersByLogin(login, accessToken)
      if (channel.data && !channel.error) {
        resolved.push({
          login,
          id: channel.data.id,
          name: channel.data.display_name ?? login,
          avatar: channel.data.profile_image_url ?? '',
        })
      } else if (channel.error && channel.error.status !== 401) {
        invalid.push(login)
      }
    }
    store.setTwitchResolved(resolved, invalid)
  },
}

const buildUserTags: TaskDef = {
  name: 'buildUserTags',
  everyMs: 4 * 60 * 60 * 1000,
  run: async ({ store, env }) => {
    const db = getDB(env)

    const tagUsageRows = await db
      .select({
        tagId: tagUserCountsView.tagId,
        usage: tagUserCountsView.userCount,
      })
      .from(tagUserCountsView)
      .leftJoin(tags, eq(tags.id, tagUserCountsView.tagId))
      .orderBy(desc(tagUserCountsView.userCount))
    const usageMap = new Map<number, number>(
      tagUsageRows.map((r) => [r.tagId, r.usage]),
    )

    const rows = await db
      .select({
        userId: userDisplayView.userId,
        tiltifySlug: userDisplayView.tiltifySlug,
        name: tags.name,
        tagId: tags.id,
        tagSlug: tags.slug,
        color: tags.color,
      })
      .from(userDisplayView)
      .leftJoin(userTagsTable, eq(userTagsTable.userId, userDisplayView.userId))
      .leftJoin(tags, eq(userTagsTable.tagId, tags.id))
      .all()

    const byUser = new Map<number, UserWithTags>()
    for (const r of rows) {
      let entry = byUser.get(r.userId)
      if (!entry) {
        entry = { userId: r.userId, tiltifySlug: r.tiltifySlug ?? '', tags: [] }
        byUser.set(r.userId, entry)
      }
      if (r.tagId != null) {
        entry.tags.push({
          id: r.tagId,
          name: r.name!,
          slug: r.tagSlug!,
          color: r.color!,
          usage: usageMap.get(r.tagId) ?? 0,
        })
      }
    }

    const result = Array.from(byUser.values())
    for (const u of result) {
      u.tags.sort((a, b) => b.usage - a.usage || a.slug.localeCompare(b.slug))
    }
    store.setUserTags(result)
  },
}

const buildSchedule: TaskDef = {
  name: 'buildSchedule',
  everyMs: 60 * 60 * 1000,
  timeoutMs: 5 * 60 * 1000,
  run: async ({ store, env }) => {
    const year = new Date().getUTCFullYear()
    const db = getDB(env)

    // schedule-slug map for community campaign links (visible + primary)
    const slugRows = await db
      .select({
        tiltifySlug: userDisplayView.tiltifySlug,
        scheduleSlug: schedulesTable.slug,
      })
      .from(schedulesTable)
      .innerJoin(
        userDisplayView,
        eq(userDisplayView.userId, schedulesTable.ownerId),
      )
      .where(
        and(
          eq(schedulesTable.year, year),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
        ),
      )
      .all()
    store.setScheduleSlugs(
      new Map(slugRows.map((r) => [r.tiltifySlug, r.scheduleSlug])),
    )

    const scheduleRows = await db
      .select({ id: schedulesTable.id, ownerId: schedulesTable.ownerId })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.year, year),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
        ),
      )
      .all()

    const scheduleOwnerMap = new Map<number, number>(
      scheduleRows.map((r) => [r.id, r.ownerId]),
    )
    const scheduleIds = scheduleRows.map((s) => s.id)

    const basePairs: Array<{ scheduleId: number; streamId: number; start: Date }> =
      []
    for (const sid of scheduleIds) {
      const rows = await db
        .select({
          scheduleId: streamsTable.scheduleId,
          streamId: streamsTable.id,
          start: streamsTable.start,
        })
        .from(streamsTable)
        .where(
          and(eq(streamsTable.visible, true), eq(streamsTable.scheduleId, sid)),
        )
        .orderBy(asc(streamsTable.start))
        .all()
      for (const row of rows) basePairs.push(row)
    }

    const detailMap = new Map<string, any>()
    const tagsMap = new Map<
      string,
      Array<{ name: string; slug: string; color: string }>
    >()
    const participantsMap = new Map<string, any[]>()

    for (const p of basePairs) {
      const rows = await db
        .select({
          id: streamsTable.id,
          scheduleId: streamsTable.scheduleId,
          createdBy: streamsTable.createdBy,
          title: streamsTable.title,
          visible: streamsTable.visible,
          subtitle: streamsTable.subtitle,
          description: streamsTable.description,
          youtubeVodUrl: streamsTable.youtubeVodUrl,
          twitchVodUrl: streamsTable.twitchVodUrl,
          start: streamsTable.start,
          end: streamsTable.end,
        })
        .from(streamsTable)
        .where(
          and(
            eq(streamsTable.scheduleId, p.scheduleId),
            eq(streamsTable.id, p.streamId),
          ),
        )
        .all()
      for (const s of rows) detailMap.set(`${s.scheduleId}:${s.id}`, s)

      const tagRows = await db
        .select({
          scheduleId: streamTagsTable.scheduleId,
          streamId: streamTagsTable.streamId,
          name: tags.name,
          slug: tags.slug,
          color: tags.color,
        })
        .from(streamTagsTable)
        .innerJoin(tags, eq(streamTagsTable.tagId, tags.id))
        .where(
          and(
            eq(streamTagsTable.scheduleId, p.scheduleId),
            eq(streamTagsTable.streamId, p.streamId),
          ),
        )
        .all()
      for (const t of tagRows) {
        const key = `${t.scheduleId}:${t.streamId}`
        const arr = tagsMap.get(key) ?? []
        arr.push({ name: t.name, slug: t.slug, color: t.color })
        tagsMap.set(key, arr)
      }

      const partRows = await db
        .select({
          scheduleId: streamParticipantsTable.scheduleId,
          streamId: streamParticipantsTable.streamId,
          userId: userDisplayView.userId,
          primaryLiveStream: userDisplayView.primaryLiveStream,
          createdAt: userDisplayView.createdAt,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          twitchLogin: userDisplayView.twitchLogin,
          tiltifySlug: userDisplayView.tiltifySlug,
          tiltifyUrl: userDisplayView.tiltifyUrl,
          primaryColor: userDisplayView.primaryColor,
          accentColor: userDisplayView.accentColor,
        })
        .from(streamParticipantsTable)
        .innerJoin(
          userDisplayView,
          eq(streamParticipantsTable.userId, userDisplayView.userId),
        )
        .where(
          and(
            eq(streamParticipantsTable.scheduleId, p.scheduleId),
            eq(streamParticipantsTable.streamId, p.streamId),
          ),
        )
        .all()
      for (const r of partRows) {
        const key = `${r.scheduleId}:${r.streamId}`
        const arr = participantsMap.get(key) ?? []
        arr.push(r)
        participantsMap.set(key, arr)
      }
    }

    const ownerIds = Array.from(new Set(scheduleRows.map((r) => r.ownerId)))
    const ownersMap = new Map<number, UserDisplay>()
    for (const oid of ownerIds) {
      const rows = await db
        .select({
          userId: userDisplayView.userId,
          primaryLiveStream: userDisplayView.primaryLiveStream,
          createdAt: userDisplayView.createdAt,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          twitchLogin: userDisplayView.twitchLogin,
          tiltifySlug: userDisplayView.tiltifySlug,
          tiltifyUrl: userDisplayView.tiltifyUrl,
          primaryColor: userDisplayView.primaryColor,
          accentColor: userDisplayView.accentColor,
        })
        .from(userDisplayView)
        .where(eq(userDisplayView.userId, oid))
        .all()
      for (const o of rows as any) ownersMap.set(o.userId, o)
    }

    const allUserStreams: UserStream[] = []
    for (const pair of basePairs) {
      const key = `${pair.scheduleId}:${pair.streamId}`
      const core = detailMap.get(key)
      if (!core) continue
      const stream: Stream = {
        ...(core as any),
        tags: tagsMap.get(key) ?? [],
        participants: participantsMap.get(key) ?? [],
      }
      const ownerId = scheduleOwnerMap.get(pair.scheduleId)
      const owner = ownerId ? ownersMap.get(ownerId) : undefined
      allUserStreams.push({ stream, owner })
    }

    const groups = new Map<string, { day: Date; streams: UserStream[] }>()
    for (const us of allUserStreams) {
      const s = us.stream
      const d = new Date(
        Date.UTC(
          s.start.getUTCFullYear(),
          s.start.getUTCMonth(),
          s.start.getUTCDate(),
        ),
      )
      const key = d.toISOString()
      const g = groups.get(key) ?? { day: d, streams: [] }
      g.streams.push(us)
      groups.set(key, g)
    }
    const days = Array.from(groups.values())
      .map(({ day, streams }) => ({
        day,
        streams: streams.sort(
          (a, b) => a.stream.start.getTime() - b.stream.start.getTime(),
        ),
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime())

    const result: FullCommunitySchedule = { days, streams: allUserStreams }
    await store.setFullSchedule(result)
  },
}

const updateProfiles: TaskDef = {
  name: 'updateProfiles',
  everyMs: 2 * 60 * 60 * 1000,
  timeoutMs: 5 * 60 * 1000,
  run: async ({ env }) => {
    const db = getDB(env)
    const accountsList = await db
      .select()
      .from(accounts)
      .where(eq(accounts.provider, 'tiltify'))
      .all()
    const api = new TiltifyAPI(env)
    const token = await api.getAppToken()
    if (!token) {
      console.error('updateProfiles', 'no tiltify token')
      return
    }
    for (const account of accountsList) {
      const tiltifyUser = await api.getUserById(account.providerId, token)
      try {
        if (tiltifyUser) {
          await db
            .update(accounts)
            .set({
              providerUsername: tiltifyUser.data.username,
              meta: tiltifyUser.data,
            })
            .where(eq(accounts.userId, account.userId))
        }
      } catch (e) {
        console.error('updateProfiles', 'error', e)
      }
    }
  },
}

export function buildTasks(): TaskDef[] {
  return [
    ingestEvent,
    ingestCampaigns,
    checkLive,
    fetchFX,
    syncSocials,
    validateTwitch,
    buildUserTags,
    buildSchedule,
    updateProfiles,
  ]
}

import { contracts } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { adminAuthMiddleware } from '../../middleware/authAdminMiddleware.ts'
import { getDB } from '../../../db/db.ts'
import { twitchChannelSchema, twitchStreamSchema, } from '../../../db/schema/twitch-channel-schema.ts'
import { TwitchLiveCheckQueue } from '../../../../queues/TwitchLiveCheckQueue.ts'
import { getToken, getTwitchDataByLogins } from '../../../twitchAPIFuncs.ts'
import { and, eq, getTableColumns, inArray } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { chunk } from '../../../../do/utils/chunk.ts'
import type { TwitchUser } from '../../../model/TwitchAPIModel.ts'
import { accounts, userSocials } from '../../../db/schema/auth-schema.ts'
import { schedulesTable, streamParticipantsTable, streamsTable, } from '../../../db/schema/jj-schema.ts'
import { streamTagsTable, tags } from '../../../db/schema/tags-schema.ts'
import { CONTENT_VISIBILITY_KV_KEY, readContentVisibility } from '../../../services/overlayVisibility.ts'

const os = implement(contracts).use(adminAuthMiddleware)

const refreshJJAPIData = os.refreshJJAPIDataContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.refresh()
      await stub.refreshAllCampaigns()
      await stub.loadAllTiltifySocials()
      await stub.validateTwitchChannels()
      await stub.checkLiveStreams()
      await stub.buildAndStoreUserTags()
      await stub.insertIntoDB({ resend: true })
      // The readers use the display projections, not the raw keys refreshed above (F-21).
      await stub.buildDisplayData()
    } catch (e: any) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: e?.message ?? 'Failed to refresh',
      })
    }
  },
)

// --- Scheduler/task admin handlers ---

const getSchedulerTasksStatus = os.getSchedulerTasksStatusContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const [paused, tasks] = await Promise.all([
      stub.isSchedulerPaused(),
      stub.getTasksStatus(),
    ])
    return { paused, tasks }
  },
)

const setTaskEnabled = os.setTaskEnabledContract.handler(
  async ({ context, input }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    await stub.setTaskEnabled(input.name, input.enabled)
  },
)

const runSchedulerTask = os.runSchedulerTaskContract.handler(
  async ({ context, input }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    await stub.runTask(input.name)
  },
)

const runOverdueTasksNow = os.runOverdueTasksNowContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    await stub.runOverdueNow()
  },
)

const setSchedulerPaused = os.setSchedulerPausedContract.handler(
  async ({ context, input }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    await stub.setSchedulerPaused(input.paused)
  },
)

const addStringConfig = os.addStringConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setStringConfig(input.key, input.value)
  },
)

const addNumberConfig = os.addNumberConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setNumberConfig(input.key, input.value)
  },
)

const addBooleanConfig = os.addBooleanConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.setBooleanConfig(input.key, input.value)
  },
)

const removeConfigContract = os.removeConfigContract.handler(
  async ({ input, context }) => {
    const DO = context.env.ConfigDO
    const stubId = DO.idFromName('ConfigDO')
    const stub = DO.get(stubId)
    await stub.deleteConfig(input.key)
  },
)

const getAllConfigs = os.getAllConfigsContract.handler(async ({ context }) => {
  const DO = context.env.ConfigDO
  const stubId = DO.idFromName('ConfigDO')
  const stub = DO.get(stubId)
  const map = await stub.getAllConfig()
  return map
    .keys()
    .toArray()
    .map((key) => {
      const v = map.get(key)!
      switch (v.type) {
        case 'string':
          return {
            key: key,
            type: 'string',
            value: v.value as string,
          }
        case 'number':
          return {
            key: key,
            type: 'number',
            value: v.value as number,
          }
        case 'boolean':
          return {
            key: key,
            type: 'boolean',
            value: v.value as boolean,
          }
      }
    })
})

const getKVValue = os.getKVValueContract.handler(async ({ context, input }) => {
  const { key } = input
  const KV = context.env.KV
  const value = await KV.get(key)
  if (value === null) {
    throw new ORPCError('NOT_FOUND', {
      message: `Value for key: ${key} not found`,
    })
  }
  return {
    key,
    value,
  }
})

const getAllKVKeys = os.getAllKVKeysContract.handler(async ({ context }) => {
  const KV = context.env.KV
  const result = await KV.list()
  const keys = result.keys
  return keys.map((k) => k.name)
})

const putKVValue = os.putKVValueContract.handler(async ({ context, input }) => {
  const { key, value } = input
  const KV = context.env.KV
  await KV.put(key, value)
})

const deleteKVValue = os.deleteKVValueContract.handler(
  async ({ context, input }) => {
    const { key } = input
    const KV = context.env.KV
    await KV.delete(key)
  },
)

const setContentVisibility = os.setContentVisibilityContract.handler(
  async ({ context, input }) => {
    await context.env.KV.put(
      CONTENT_VISIBILITY_KV_KEY,
      input.hidden ? 'hidden' : 'visible',
    )
    return input.hidden
  },
)

const getContentVisibility = os.getContentVisibilityContract.handler(
  async ({ context }) => {
    return (await readContentVisibility(context.env)) === 'hidden'
  },
)

const triggerTwitchLiveCheck = os.triggerTwitchLiveCheckContract.handler(
  async ({ context }) => {
    try {
      const db = getDB(context.env)
      const twitchChannels = await db.select().from(twitchChannelSchema).all()


      const DO = context.env.JingleJamData
      const stubID = DO.idFromName('JJ_API_CACHE')
      const stub = DO.get(stubID)

      const dbLogins = twitchChannels.map((channel) => channel.login)
      const validLogins = await stub.getValidTwitchLogins()
      const logins = [...dbLogins, ...validLogins]
      const uniqueLogins = [...new Set(logins)]

      const queue = new TwitchLiveCheckQueue()
      await queue.sendLogins(uniqueLogins, context.env)
    } catch (e) {
      console.error(e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

const getTwitchStreams = os.getTwitchStreamsContract.handler(
  async ({ context }) => {
    const db = getDB(context.env)
    const rows = await db
      .select({
        login: twitchStreamSchema.userLogin,
        displayName: twitchStreamSchema.userName,
        title: twitchStreamSchema.title,
      })
      .from(twitchStreamSchema)
      .all()


    const out = rows.map((r) => ({
      userLogin: r.login,
      displayName: r.displayName ?? undefined,
      title: r.title ?? null,
      isLive: r.title != null,
      url: `https://twitch.tv/${r.login}`,
    }))

    // Sort live first then by login
    out.sort((a, b) =>
      a.isLive === b.isLive
        ? a.userLogin.localeCompare(b.userLogin)
        : a.isLive
          ? -1
          : 1,
    )

    return out
  },
)

const getGBPToEURRate = os.getGBPToEURRateContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.fetchGBPToEURConversionRate()
    } catch (e) {
      console.error(e)
    }
    try {
      const value = await stub.getGbpToEurRate()
      return value
    } catch (e: any) {
      console.error('getGBPToEURRate', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: e?.message ?? 'Failed to fetch GBP→EUR rate',
      })
    }
  },
)

// The lower-cased login of a Twitch social: a bare login or a channel URL, where the login is the
// first path segment (`https://www.twitch.tv/User/videos?x=1` → `user`). Twitch logins are
// case-insensitive and the resolved users are keyed by the lower-cased login (F-20).
function twitchLoginFromSocial(value: string): string | undefined {
  if (!value.startsWith('http')) return value.toLowerCase()
  try {
    return new URL(value).pathname.split('/').find(Boolean)?.toLowerCase()
  } catch {
    return undefined
  }
}

// Sync Twitch channels from user socials (provider: 'twitch')
const syncTwitchChannelsFromSocials =
  os.syncTwitchChannelsFromSocialsContract.handler(async ({ context }) => {
    const db = context.db

    // 1) Get all socials with provider = 'twitch' and extract logins via the view
    const socials = await db
      .select({
        userId: userSocials.userId,
        provider: userSocials.provider,
        url: userSocials.url,
      })
      .from(userSocials)
      .where(eq(userSocials.provider, 'twitch'))
      .all()

    if (socials.length === 0) return

    // 2) Find users who already have a twitch_channels entry
    const existing = await db
      .select({ userId: twitchChannelSchema.userId })
      .from(twitchChannelSchema)
      .all()


    const existingUserIds = new Set(existing.map((e) => e.userId))

    // 3) Build list of missing [userId, login]
    const missing = socials
      .filter((s) => !existingUserIds.has(s.userId))
      .map((s) => ({ userId: s.userId, login: twitchLoginFromSocial(s.url) }))
      .filter((m): m is { userId: number; login: string } => !!m.login)


    if (missing.length === 0) return

    // 4) Fetch Twitch user data for the missing logins in batches
    // Twitch helix/users supports up to 100 logins per request
    const twitchCredentials = {
      clientId: context.env.TWITCH_CLIENT_ID,
      clientSecret: context.env.TWITCH_CLIENT_SECRET,
    }
    const token = await getToken(twitchCredentials)

    const chunks: (typeof missing)[] = []
    for (let i = 0; i < missing.length; i += 100) {
      chunks.push(missing.slice(i, i + 100))
    }

    const userMap = new Map<string, TwitchUser>()
    for (const chunk of chunks) {
      const logins = chunk.map((m) => m.login)
      try {
        const res = await getTwitchDataByLogins(
          logins,
          token.access_token,
          twitchCredentials.clientId,
        )
        for (const u of res.data ?? []) {
          userMap.set(u.login.toLowerCase(), u)
        }
      } catch (e) {
        console.error('Failed to fetch Twitch users for chunk', e)
      }
    }

    // 5) Insert rows for any social whose Twitch user was resolved
    for (const m of missing) {
      const u = userMap.get(m.login)
      if (!u) continue
      try {
        await db
          .insert(twitchChannelSchema)
          .values({
            userId: m.userId,
            id: u.id,
            login: u.login,
            displayName: u.display_name,
            description: u.description ?? null,
            profileImageUrl: u.profile_image_url ?? null,
            offlineImageUrl: u.offline_image_url ?? null,
          })
          .run()
      } catch (e) {
        // Ignore duplicates or constraint errors to keep the job idempotent
        console.warn('Insert twitch channel failed for', m.login, e)
      }
    }
  })

// Admin handler to clear JJ DO storage
const clearJingleJamData = os.clearJingleJamDataContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.clear()
    } catch (e) {
      console.error('clearJingleJamData', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

// New admin handlers for Twitch/channel data
const getAllTwitchChannels = os.getAllTwitchChannelsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const channels = await stub.getAllTwitchLogins()
      return channels
    } catch (e) {
      console.error('getAllTwitchChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

// Mirror of getAllTwitchChannels but for YouTube
const getAllYoutubeChannels = os.getAllYoutubeChannelsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const channels = await stub.getAllYoutubeLogins()
      return channels
    } catch (e) {
      console.error('getAllYoutubeChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

const getAllLiveChannels = os.getAllLiveChannelsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const channels = await stub.getLiveLogins()
      return channels
    } catch (e) {
      console.error('getAllLiveChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

const validateTwitchChannels = os.validateTwitchChannelsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.validateTwitchChannels()
    } catch (e) {
      console.error('validateTwitchChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

const checkLiveStreams = os.checkLiveStreamsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.checkLiveStreams()
    } catch (e) {
      console.error('checkLiveStreams', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

// Invalid Twitch channels handlers
const getInvalidTwitchChannels = os.getInvalidTwitchChannelsContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const channels = await stub.getInvalidTwitchLogins()
      return channels
    } catch (e) {
      console.error('getInvalidTwitchChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

const clearInvalidTwitchChannels =
  os.clearInvalidTwitchChannelsContract.handler(async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.clearInvalidTwitchLogins()
    } catch (e) {
      console.error('clearInvalidTwitchChannels', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  })

const getAllSchedules = os.getAllSchedulesContract.handler(
  async ({ context }) => {
    const db = context.db
    try {
      const rows = await db
        .select({
          scheduleId: schedulesTable.id,
          year: schedulesTable.year,
          visible: schedulesTable.visible,
          primary: schedulesTable.primary,
          ownerId: schedulesTable.ownerId,
          ownerName: accounts.providerUsername,
        })
        .from(schedulesTable)
        .leftJoin(
          accounts,
          and(
            eq(accounts.userId, schedulesTable.ownerId),
            eq(accounts.provider, 'tiltify'),
          ),
        )
        .orderBy(schedulesTable.id)
        .all()

      return rows.map((r) => ({
        scheduleId: r.scheduleId,
        year: r.year,
        visible: r.visible,
        primary: r.primary,
        ownerId: r.ownerId,
        ownerName: r.ownerName ?? '',
      }))
    } catch (e) {
      console.error('getAllSchedules', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR')
    }
  },
)

// Export schedule as JSON
const exportSchedule = os.exportScheduleContract.handler(
  async ({ context, input }) => {
    const db = context.db
    const { scheduleId } = input

    // 1) Load schedule meta
    const schedule = await db
      .select({
        id: schedulesTable.id,
        title: schedulesTable.title,
        slug: schedulesTable.slug,
        year: schedulesTable.year,
        visible: schedulesTable.visible,
        primary: schedulesTable.primary,
        ownerId: schedulesTable.ownerId,
        createdAt: schedulesTable.createdAt,
        updatedAt: schedulesTable.updatedAt,
      })
      .from(schedulesTable)
      .where(eq(schedulesTable.id, scheduleId))
      .get()

    if (!schedule) {
      throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
    }

    // 2) Load streams
    const streams = await db
      .select()
      .from(streamsTable)
      .where(eq(streamsTable.scheduleId, scheduleId))
      .all()

    const streamIds = streams.map((s) => s.id)

    // 3) Load participants per stream
    const participants =
      streamIds.length > 0
        ? await db
            .select({
              streamId: streamParticipantsTable.streamId,
              userId: streamParticipantsTable.userId,
            })
            .from(streamParticipantsTable)
            .where(
              and(
                eq(streamParticipantsTable.scheduleId, scheduleId),
                inArray(streamParticipantsTable.streamId, streamIds),
              ),
            )
            .all()
        : []

    const participantsByStream: Record<number, number[]> = {}
    for (const p of participants) {
      participantsByStream[p.streamId] = participantsByStream[p.streamId] || []
      participantsByStream[p.streamId].push(p.userId)
    }

    // 4) Load tags per stream (export by slug for portability)
    const tagRows =
      streamIds.length > 0
        ? await db
            .select({
              streamId: streamTagsTable.streamId,
              tagId: streamTagsTable.tagId,
              slug: tags.slug,
            })
            .from(streamTagsTable)
            .innerJoin(tags, eq(streamTagsTable.tagId, (tags as any).id))
            .where(
              and(
                eq(streamTagsTable.scheduleId, scheduleId),
                inArray(streamTagsTable.streamId, streamIds),
              ),
            )
            .all()
        : []

    const tagsByStream: Record<number, string[]> = {}
    for (const t of tagRows) {
      tagsByStream[t.streamId] = tagsByStream[t.streamId] || []
      tagsByStream[t.streamId].push(t.slug)
    }

    // 5) Build export structure
    const payload = {
      version: 1,
      schedule,
      streams: streams.map((s) => ({
        ...s,
        participants: participantsByStream[s.id] ?? [],
        tags: tagsByStream[s.id] ?? [],
      })),
    }

    return JSON.stringify(payload)
  },
)

// D1 allows 100 bound parameters per statement; each row binds at most one per column.
const MAX_BOUND_PARAMS = 100
const rowsPerStatement = (table: SQLiteTable) =>
  Math.floor(MAX_BOUND_PARAMS / Object.keys(getTableColumns(table)).length)

// Import schedule from JSON
const importSchedule = os.importScheduleContract.handler(
  async ({ context, input }) => {
    const db = context.db
    let parsed: any
    try {
      parsed = JSON.parse(input.json)
    } catch (e) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid JSON' })
    }

    // Minimal validation
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.schedule ||
      !Array.isArray(parsed.streams)
    ) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid export format' })
    }

    const schedule = parsed.schedule as {
      id: number
      title: string
      slug: string
      year: number
      visible: boolean
      primary: boolean
      ownerId: number
    }
    const streams = parsed.streams as Array<any>

    const streamSlugs = (s: any): string[] =>
      Array.isArray(s.tags) ? [...new Set(s.tags as string[])] : []
    const allSlugs = [...new Set(streams.flatMap(streamSlugs))]

    // 1) One round trip: does the id exist, and the ids of every tag slug
    const [existing, ...tagChunks] = await db.batch([
      db
        .select({ id: schedulesTable.id })
        .from(schedulesTable)
        .where(eq(schedulesTable.id, schedule.id)),
      ...chunk(allSlugs, MAX_BOUND_PARAMS).map((slugs) =>
        db
          .select({ id: tags.id, slug: tags.slug })
          .from(tags)
          .where(inArray(tags.slug, slugs)),
      ),
    ])
    if (existing.length > 0) {
      throw new ORPCError('CONFLICT', {
        message: `Schedule with id ${schedule.id} already exists`,
      })
    }
    const slugToId = new Map(tagChunks.flat().map((r) => [r.slug, r.id]))

    // 2) Check every stream before anything is written: a bad date is a BAD_REQUEST, not a
    //    half-imported schedule
    const toDate = (v: any): Date => {
      const d = v instanceof Date ? v : typeof v === 'number' || typeof v === 'string' ? new Date(v) : null
      if (!d || isNaN(d.getTime())) {
        throw new ORPCError('BAD_REQUEST', { message: 'Invalid stream start/end in import JSON' })
      }
      return d
    }
    const streamRows = streams.map((s) => ({
      id: s.id,
      scheduleId: schedule.id,
      createdBy: s.createdBy,
      title: s.title,
      visible: s.visible ?? false,
      subtitle: s.subtitle ?? null,
      description: s.description ?? null,
      youtubeVodUrl: s.youtubeVodUrl ?? null,
      twitchVodUrl: s.twitchVodUrl ?? null,
      start: toDate(s.start),
      end: toDate(s.end),
    }))

    const participantRows = streams.flatMap((s) =>
      Array.isArray(s.participants)
        ? (s.participants as number[]).map((userId) => ({
            scheduleId: schedule.id,
            streamId: s.id,
            userId,
          }))
        : [],
    )
    // Unknown slugs are skipped, as before
    const tagRows = streams.flatMap((s) =>
      streamSlugs(s)
        .filter((slug) => slugToId.has(slug))
        .map((slug) => ({
          scheduleId: schedule.id,
          streamId: s.id,
          tagId: slugToId.get(slug)!,
        })),
    )

    // 3) Everything in one atomic batch (ADM-07): a failing row leaves no partial schedule
    try {
      await db.batch([
        db.insert(schedulesTable).values({
          id: schedule.id,
          title: schedule.title,
          slug: schedule.slug,
          year: schedule.year,
          visible: schedule.visible,
          primary: schedule.primary,
          ownerId: schedule.ownerId,
        }),
        ...chunk(streamRows, rowsPerStatement(streamsTable)).map((rows) =>
          db.insert(streamsTable).values(rows),
        ),
        ...chunk(participantRows, rowsPerStatement(streamParticipantsTable)).map(
          (rows) => db.insert(streamParticipantsTable).values(rows),
        ),
        ...chunk(tagRows, rowsPerStatement(streamTagsTable)).map((rows) =>
          db.insert(streamTagsTable).values(rows),
        ),
      ])
    } catch (e) {
      console.error(e)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to import schedule',
      })
    }

    return { scheduleId: schedule.id }
  },
)

export const adminRouter = {
  refreshJJAPIData,
  addStringConfig,
  addNumberConfig,
  addBooleanConfig,
  removeConfigContract,
  getAllConfigs,
  getKVValue,
  getAllKVKeys,
  putKVValue,
  deleteKVValue,
  setContentVisibility,
  getContentVisibility,
  triggerTwitchLiveCheck,
  getTwitchStreams,
  getGBPToEURRate,
  syncTwitchChannelsFromSocials,
  // new
  clearJingleJamData,
  getAllTwitchChannels,
  getAllYoutubeChannels,
  getAllLiveChannels,
  validateTwitchChannels,
  checkLiveStreams,
  getInvalidTwitchChannels,
  clearInvalidTwitchChannels,
  getAllSchedules,
  exportSchedule,
  importSchedule,
  // scheduler
  getSchedulerTasksStatus,
  setTaskEnabled,
  runSchedulerTask,
  runOverdueTasksNow,
  setSchedulerPaused,
}

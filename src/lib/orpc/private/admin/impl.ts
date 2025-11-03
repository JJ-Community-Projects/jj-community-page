import { contracts } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { adminAuthMiddleware } from '../../middleware/authAdminMiddleware.ts'
import { getDB } from '../../../db/db.ts'
import { twitchChannelSchema, twitchStreamSchema, } from '../../../db/schema/twitch-channel-schema.ts'
import { TwitchLiveCheckQueue } from '../../../../queues/TwitchLiveCheckQueue.ts'
import { getToken, getTwitchDataByLogins } from '../../../twitchAPIFuncs.ts'
import { eq } from 'drizzle-orm'
import type { TwitchUser } from '../../../model/TwitchAPIModel.ts'
import { userSocials } from '../../../db/schema/auth-schema.ts'

const os = implement(contracts).use(adminAuthMiddleware)

const refreshJJAPIData = os.refreshJJAPIDataContract.handler(
  async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      await stub.validateTwitchChannels()
      await stub.checkLiveStreams()
      await stub.refresh()
    } catch (e: any) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: e?.message ?? 'Failed to refresh',
      })
    }
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

const triggerTwitchLiveCheck = os.triggerTwitchLiveCheckContract.handler(
  async ({ context }) => {
    try {
      const db = getDB(context.env)
      const twitchChannels = await db.select().from(twitchChannelSchema).all()

      console.log('twitchChannels', twitchChannels)

      const DO = context.env.JingleJamData
      const stubID = DO.idFromName('JJ_API_CACHE')
      const stub = DO.get(stubID)

      const dbLogins = twitchChannels.map((channel) => channel.login)
      console.log('dbLogins', dbLogins)
      const validLogins = await stub.getValidTwitchLogins()
      console.log('validLogins', validLogins)
      const logins = [...dbLogins, ...validLogins]
      const uniqueLogins = [...new Set(logins)]
      console.log('uniqueLogins', uniqueLogins)

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

    console.log('rows', rows)

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
      const value = await stub.fetchGBPToEURConversionRate()
      return value
    } catch (e: any) {
      console.error('getGBPToEURRate', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: e?.message ?? 'Failed to fetch GBP→EUR rate',
      })
    }
  },
)

// Sync Twitch channels from user socials (provider: 'twitch')
const syncTwitchChannelsFromSocials =
  os.syncTwitchChannelsFromSocialsContract.handler(async ({ context }) => {
    const db = context.db

    // 1) Get all socials with provider = 'twitch' and extract logins via the view
    const socials = await db
      .select({ userId: userSocials.userId, provider: userSocials.provider, url: userSocials.url })
      .from(userSocials)
      .where(eq(userSocials.provider, 'twitch'))
      .all()
    console.log('socials', socials)

    if (socials.length === 0) return

    // 2) Find users who already have a twitch_channels entry
    const existing = await db
      .select({ userId: twitchChannelSchema.userId })
      .from(twitchChannelSchema)
      .all()

    console.log('existing', existing)

    const existingUserIds = new Set(existing.map((e) => e.userId))

    // 3) Build list of missing [userId, login]
    const missing = socials
      .filter((s) =>  !existingUserIds.has(s.userId))
      .map((s) => ({
        userId: s.userId,
        login: s.url.startsWith('http') ? s.url.split('/').toReversed()[0]: s.url,
      }))

    console.log('missing', missing)

    if (missing.length === 0) return

    // 4) Fetch Twitch user data for the missing logins in batches
    // Twitch helix/users supports up to 100 logins per request
    const token = await getToken()

    const chunks: (typeof missing)[] = []
    for (let i = 0; i < missing.length; i += 100) {
      chunks.push(missing.slice(i, i + 100))
    }

    console.log('chunks', chunks)

    const userMap = new Map<string, TwitchUser>()
    for (const chunk of chunks) {
      const logins = chunk.map((m) => m.login)
      try {
        const res = await getTwitchDataByLogins(logins, token.access_token)
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
  triggerTwitchLiveCheck,
  getTwitchStreams,
  getGBPToEURRate,
  syncTwitchChannelsFromSocials,
  // new
  getAllTwitchChannels,
  getAllLiveChannels,
  validateTwitchChannels,
  checkLiveStreams,
}

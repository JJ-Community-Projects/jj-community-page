import { DurableObject } from 'cloudflare:workers'
import { getDB } from '../lib/db/db.ts'
import type {
  JingleJamCampaignsResponse,
  JingleJamResponse,
  JJCampaign,
  JJCause,
  JJCollections,
} from './types/JJAPIModel.ts'
import { TwitchAPI } from '../lib/twitchAPI.ts'
import type {
  CausesDisplayTVType,
  CurrenciesTV,
  JJCampaignsTVType,
  JJCampaignTVType,
  JJCauseTVType,
} from '../lib/orpc/public/twitchExtension/contract.ts'
import type { JJCampaignType } from '../lib/orpc/private/jjData/contract.ts'
import { and, desc, eq, or } from 'drizzle-orm'
import { schedulesTable } from '../lib/db/schema/jj-schema.ts'
import {
  tagUserCountsView,
  userDisplayView,
} from '../lib/db/schema/views-schema.ts'
import { tags, userTagsTable } from '../lib/db/schema/tags-schema.ts'
import { TiltifyAPI, type TiltifyUserData } from '../lib/TiltifyAPI.ts'
import { jjCampaign, jjCauses } from '../lib/db/schema/jj-api-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import type { TwitchUser } from '../lib/model/TwitchUser.ts'

type UserWithTags = {
  userId: number
  tiltifySlug: string
  tags: Array<{
    name: string
    id: number
    slug: string
    color: string
    usage: number
  }>
}

export class JingleJamData extends DurableObject<Env> {
  replaceMap: Map<string, string> = new Map([
    ['crustydoggo', 'kirsty'],
    ['bobawitch', 'boba'],
    ['boba_witch', 'boba'],
  ])

  tiltifySlugToTwitchLoginMap: Map<string, string> = new Map([
    ['hrry', 'hrry'],
    ['rtgamecrowd', 'rtgame'],
    ['bobawitch', 'boba'],
    ['crustydoggo', 'kirsty'],
    ['inthelittlewood', 'inthelittlewood'],
    ['ravs', 'ravs_'],
    ['sips-yogscast', 'sips_'],
    ['pedguin', 'pedguin'],
    ['highrollersdnd', 'highrollersdnd'],
    ['jackmanifoldtv', 'jackmanifoldtv'],
    ['mudkipninja', 'mudkipninja'],
  ])
  // Task definition
  private tasks = [
    {
      name: 'jjAPIRefresh',
      everyMs: 60 * 1000,
      run: async () => {
        await this.refresh()
        await this.refreshAllCampaigns()
        await this.insertIntoDB()
        await this.buildDisplayData()
      },
    },
    {
      name: 'validateTwitchChannels',
      everyMs: 6 * 60 * 60 * 1000,
      run: async () => {
        await this.validateTwitchChannels()
      },
    },
    {
      name: 'checkLiveStreams',
      everyMs: 5 * 60 * 1000,
      run: async () => {
        await this.checkLiveStreams()
      },
    },
    {
      name: 'fetchGBPToEURConversionRate',
      everyMs: 4 * 60 * 60 * 1000,
      run: async () => {
        await this.fetchGBPToEURConversionRate()
      },
    },
    {
      name: 'loadAllTiltifySocials',
      everyMs: 2 * 60 * 60 * 1000,
      run: async () => {
        await this.loadAllTiltifySocials()
      },
    },
    {
      name: 'buildAndStoreUserTags',
      everyMs: 2 * 60 * 60 * 1000,
      run: async () => {
        await this.buildAndStoreUserTags()
      },
    },
    {
      name: 'buildDisplayData', // previously */1 when NOT JJ season
      everyMs: 60 * 1000,
      run: async () => {
        await this.buildDisplayData()
      },
    },
  ] as const

  private get storage() {
    return this.ctx.storage
  }

  // Causes
  public async setTVCause(cause: JJCauseTVType) {
    await this.storage.put(this.causeKeyTV(cause.id), cause)
  }

  public async setCauses(causes: JJCause[]) {
    const entries: Record<string, JJCause> = {}
    for (const c of causes) entries[this.causeKey(c.id)] = c
    await this.storage.put(entries)
  }

  public getTVCause(causeId: string) {
    return this.storage.get(this.causeKeyTV(causeId)) as Promise<
      JJCauseTVType | undefined
    >
  }

  public getCause(causeId: string) {
    return this.storage.get(this.causeKey(causeId)) as Promise<
      JJCause | undefined
    >
  }

  public async getCausesTV() {
    const map = (await this.storage.list({ prefix: 'cause:tv:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCauseTVType[]
  }

  public async getCauses() {
    const map = (await this.storage.list({ prefix: 'cause:raw:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCause[]
  }

  // Campaigns
  public async setCampaign(campaign: JJCampaign) {
    await this.storage.put(this.campaignKey(campaign.id), campaign)
  }

  public async setCampaigns(campaigns: JJCampaign[]) {
    const entries: Record<string, JJCampaign> = {}
    for (const c of campaigns) {
      entries[this.campaignKey(c.id)] = c
    }
    await this.storage.put(entries)
  }

  public getCampaign(userRef: string) {
    return this.storage.get(this.campaignKey(userRef)) as Promise<
      JJCampaign | undefined
    >
  }

  public getCampaignBySlug(slug: string) {
    return this.storage.get(`campaign:by-slug:${slug}`) as Promise<
      JJCampaign | undefined
    >
  }

  public async getCampaigns() {
    const map = (await this.storage.list({ prefix: 'campaign:api:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCampaign[]
  }

  public async getCampaignsForCause(causeId: string) {
    const campaigns = await this.getCampaigns()
    return campaigns.filter((c) => c.causeId === causeId)
  }

  public async fetchCampaigns(
    limit: number,
    offset: number,
  ): Promise<JingleJamCampaignsResponse> {
    const res = await fetch(
      this.env.JJ_DASHBOARD_URL +
        '/api/campaigns?' +
        'limit=' +
        limit +
        '&offset=' +
        offset,
    )
    if (!res.ok) {
      throw new Error(
        `Failed to fetch JingleJam campaigns: ${res.status} ${res.statusText}`,
      )
    }
    const data = (await res.json()) as JingleJamCampaignsResponse
    console.log('fetchCampaigns', data.campaigns.count)
    return data
  }

  public async refreshAllCampaigns() {
    const limit = 100
    let offset = 0
    const all: JJCampaign[] = []

    try {
      while (true) {
        const res = await this.fetchCampaigns(limit, offset)
        // Try common shapes: list or campaigns
        const batch: JJCampaign[] =
          // @ts-ignore – tolerate different response shapes
          (res as any)?.list ?? ((res as any)?.campaigns as JJCampaign[]) ?? []

        if (!Array.isArray(batch) || batch.length === 0) break

        all.push(...batch)

        // If we received fewer than limit items, we've reached the end
        if (batch.length < limit) break

        offset += limit
      }
      console.log('refreshAllCampaigns', 'all', all.length)
      await this.setCampaigns(all)
    } catch (e) {
      console.error('refreshAllCampaigns failed', e)
      // Best-effort: still persist whatever we have
      if (all.length > 0) {
        try {
          await this.setCampaigns(all)
        } catch (e2) {
          console.error('refreshAllCampaigns setCampaigns partial failed', e2)
        }
      }
    }
  }

  // Refresh from API and persist to storage and DB
  public async refresh() {
    const res = await fetch(this.env.JJ_DASHBOARD_URL + '/api/tiltify')
    if (!res.ok) {
      throw new Error(
        `Failed to fetch JingleJam data: ${res.status} ${res.statusText}`,
      )
    }

    const data = (await res.json()) as JingleJamResponse

    // Update DO storage (granular)
    try {
      await this.setCauses(data.causes)
    } catch (e) {
      console.error('setCauses', e)
    }

    /*
    try {
      await this.setCampaigns(data.campaigns.list)
      for (const c of data.campaigns.list) {
        await this.storage.put(`campaign:by-slug:${c.user.slug}`, c)
      }
    } catch (e) {
      console.error('setCampaigns', e)
    }*/

    // Store event metadata as separate keys
    try {
      await this.storage.put('date', data.date)
    } catch (e) {
      console.error('put date', e)
    }
    try {
      await this.storage.put('event:year', data.event.year)
    } catch (e) {
      console.error('put event:year', e)
    }

    try {
      await this.storage.put('raised', data.raised)
    } catch (e) {
      console.error('put raised', e)
    }

    try {
      await this.storage.put('collections', data.collections)
    } catch (e) {
      console.error('put collections', e)
    }

    try {
      await this.storage.put('donations', data.donations)
    } catch (e) {
      console.error('put donations', e)
    }

    try {
      await this.storage.put('dollarConversionRate', data.dollarConversionRate)
    } catch (e) {
      console.error('put dollarConversionRate', e)
    }
  }

  public async buildDisplayData() {
    // Build and store display projections matching JJCampaignsSchema
    await this.buildAndStoreCampaignsDisplay()

    // Build and store display projections for causes
    await this.buildAndStoreCausesDisplay()

    // Build and store display projections for community campaigns
    await this.buildAndStoreCommunityCampaignsDisplay()
  }

  public async insertIntoDB() {
    const causes = await this.getCauses()
    const campaigns = await this.getCampaigns()
    const year = await this.storage.get<number>('event:year')
    try {
      const db = getDB(this.env)

      // Conservative variable ceiling (SQLite default is 999). Leave some safety headroom.
      const VARS_LIMIT = 5

      // Helper to chunk an array
      const chunk = <T>(arr: T[], size: number) => {
        const out: T[][] = []
        for (let i = 0; i < arr.length; i += size)
          out.push(arr.slice(i, i + size))
        return out
      }

      // Prepare rows
      const causeRows = await Promise.all(
        causes.map(async (cause) => ({
          id: cause.id,
          year: year!,
          name: cause.name,
          logo: cause.logo,
          description: cause.description,
          url: cause.url,
          donateUrl: cause.donateUrl,
          raised: cause.raised,
        })),
      )

      const tiltifyUsers = await this.getTiltifyUsersMap()

      const getLivestream = (slug: string) => {
        const user = tiltifyUsers.get(slug)
        if (!user)
          return {
            channel: '',
            type: '',
          }
        const twitch =
          this.tiltifySlugToTwitchLoginMap.get(slug) ?? user.social.twitch
        if (twitch) {
          return {
            channel: this.normalizeTwitchLogin(twitch),
            type: 'twitch',
          }
        }
        if (user.social.youtube) {
          return {
            channel: user.social.youtube,
            type: 'youtube',
          }
        }
      }

      const campaignRows = await Promise.all(
        campaigns.map(async (c) => ({
          year: year!,
          causeId: c.causeId ? await c.causeId! : null,
          name: c.name,
          description: c.description,
          slug: c.slug,
          url: c.url,
          startTime: c.startTime ?? '',
          raised: c.raised,
          goal: c.goal,
          livestream: getLivestream(c.user.slug),
          userName: c.user.name,
          userSlug: c.user.slug,
          userAvatar: c.user.avatar,
          userUrl: c.user.url,
        })),
      )

      // Estimate columns per row (must match the values object shape)
      const CAUSE_COLS = 4
      const CAMPAIGN_COLS = 4 // adjust to exact count if different

      const causeChunkSize = Math.max(1, Math.floor(VARS_LIMIT / CAUSE_COLS))
      const campaignChunkSize = Math.max(
        1,
        Math.floor(VARS_LIMIT / CAMPAIGN_COLS),
      )

      const causeChunks = chunk(causeRows, causeChunkSize)
      const campaignChunks = chunk(campaignRows, campaignChunkSize)

      // Build statements, but keep batch sizes moderate as well
      const statements: BatchItem<'sqlite'>[] = []

      for (const rows of causeChunks) {
        statements.push(db.insert(jjCauses).values(rows).onConflictDoNothing())
      }
      for (const rows of campaignChunks) {
        statements.push(
          db.insert(jjCampaign).values(rows).onConflictDoNothing(),
        )
      }

      // Optionally, run statements in batches to avoid huge batch payloads
      const BATCH_SIZE = 25
      for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        const slice = statements.slice(i, i + BATCH_SIZE)
        const [firstOp, ...restOps] = slice
        await db.batch([firstOp, ...restOps] as const)
      }
    } catch (e) {
      console.error('db.batch persist JJ data', e)
    }
  }

  public async getDollarConversionRate() {
    const dollarConversionRate = await this.storage.get<number>(
      'dollarConversionRate',
    )
    return dollarConversionRate ?? 1
  }

  // Returns the cached GBP->EUR rate or 1 if not available
  public async getGbpToEurRate() {
    const rate = await this.storage.get<number>('gbp:eur:rate')
    return rate ?? 1
  }

  public async getRaised() {
    const raised = await this.storage.get<number>('raised')
    return raised ?? 0
  }

  public async getCollections() {
    const collections = await this.storage.get<JJCollections>('collections')
    return collections ?? { redeemed: 0, total: 0 }
  }

  public async getDonations() {
    const donations = await this.storage.get<number>('donations')
    return donations ?? 0
  }

  public async getDate() {
    const donations = await this.storage.get<string>('date')
    return donations ?? new Date().toISOString()
  }

  public getCampaignsDisplay(): Promise<JJCampaignsTVType | undefined> {
    return this.storage.get<JJCampaignsTVType>('campaigns:display')
  }

  // New: full list (ALL) campaigns display
  public getCampaignsDisplayAll(): Promise<JJCampaignsTVType | undefined> {
    return this.storage.get<JJCampaignsTVType>('campaigns:display:all')
  }

  public getCausesDisplay(): Promise<CausesDisplayTVType | undefined> {
    return this.storage.get<CausesDisplayTVType>('causes:display')
  }

  // New: full list (ALL) causes display
  public getCausesDisplayAll(): Promise<CausesDisplayTVType | undefined> {
    return this.storage.get<CausesDisplayTVType>('causes:display:all')
  }

  public async getLiveLogins() {
    return this.getStringArray('twitch:liveStreams:logins')
  }

  // String array helpers
  public async setStringArray(name: string, values: string[]) {
    await this.storage.put(this.stringArrayKey(name), values)
  }

  public async getStringArray(name: string) {
    const values = await this.storage.get<string[]>(this.stringArrayKey(name))
    return values ?? []
  }

  public async validateTwitchChannels() {
    const api = new TwitchAPI(this.env)

    const logins = await this.getTwitchLoginsFromCampaigns()

    const accessToken = await api.getAppToken()

    const invalidLogins: string[] = []

    const storedInvalidLogins = await this.getStringArray(
      'twitch:invalidLogins',
    )
    const storedValidLogins = await this.getStringArray('twitch:validLogins')
    // Normalize previously stored invalid logins for proper comparison
    const storedInvalidSet = new Set(storedInvalidLogins)
    const storedValidSet = new Set(storedValidLogins)

    const loginsToValidate = logins.filter((l) => !storedValidSet.has(l))
    const validLogins: string[] = [...storedValidSet]

    console.log('validateTwitchChannels', 'campaignLogins', logins.length)
    console.log(
      'validateTwitchChannels',
      'storedValidLogins',
      storedValidLogins.length,
    )
    console.log(
      'validateTwitchChannels',
      'storedInvalidLogins',
      storedInvalidLogins.length,
    )
    console.log(
      'validateTwitchChannels',
      'loginsToValidate',
      loginsToValidate.length,
    )

    for (const login of loginsToValidate) {
      const normalized = this.normalizeTwitchLogin(login)
      if (!normalized) continue

      if (storedInvalidSet.has(normalized)) {
        invalidLogins.push(normalized)
        // console.log('validateTwitchChannels', 'isInvalid', normalized)
        continue
      }

      const channel = await api.fetchUsersByLogin(normalized, accessToken)

      if (channel.data && !channel.error) {
        if (!validLogins.includes(normalized)) validLogins.push(normalized)

        await this.storage.put(`twitch:id:${channel.data.id}`, channel.data)
        await this.storage.put(
          `twitch:login:${channel.data.login}`,
          channel.data,
        )
      } else {
        if (channel.error.status !== 401) {
          if (!invalidLogins.includes(normalized))
            invalidLogins.push(normalized)
        }
      }
    }

    console.log('validateTwitchChannels', 'validLogins', validLogins.length)
    console.log('validateTwitchChannels', 'invalidLogins', invalidLogins.length)

    await this.setStringArray('twitch:validLogins', validLogins)
    await this.setStringArray('twitch:invalidLogins', invalidLogins)
  }

  public getTwitchChannelByChannelId(channelId: string) {
    return this.storage.get<TwitchUser>(`twitch:id:${channelId}`)
  }

  public async checkLiveStreams() {
    const logins = await this.getStringArray('twitch:validLogins')
    const api = new TwitchAPI(this.env)
    const accessToken = await api.getAppToken()
    const liveStreamsIds: string[] = []
    const liveStreamsLogins: string[] = []
    const loginChunks = this.chunk(logins, 50)
    console.log('checkLiveStreams', 'logins', logins)
    console.log('checkLiveStreams', 'logins', logins.length)
    for (const logins of loginChunks) {
      const stream = await api.fetchStreamsByLogins(logins, accessToken)
      if (stream.data && !stream.error) {
        for (const s of stream.data) {
          liveStreamsIds.push(s.user_id)
          liveStreamsLogins.push(s.user_login)
        }
      }
    }
    await this.setStringArray('twitch:liveStreams:ids', liveStreamsIds)
    await this.setStringArray('twitch:liveStreams:logins', liveStreamsLogins)
    console.log('checkLiveStreams', 'liveStreamsLogins', liveStreamsLogins)
    console.log(
      'checkLiveStreams',
      'liveStreamsLogins',
      liveStreamsLogins.length,
    )

    // Update per-campaign live flags based on current live logins
    try {
      const liveSet = new Set(liveStreamsLogins.map((l) => l.toLowerCase()))
      const campaigns = await this.getCampaigns()

      const users = await this.getTiltifyUsersMap()
      for (const c of campaigns) {
        const userSlug = c.user.slug
        const user = users.get(userSlug)
        // if (!user) continue
        const login =
          this.tiltifySlugToTwitchLoginMap.get(userSlug) ?? user?.social.twitch
        if (!login) continue
        const isLive = liveSet.has(this.normalizeTwitchLogin(login))
        await this.storage.put(`campaign:live:${c.user.slug}`, isLive)
      }
    } catch (e) {
      console.error('update campaign live flags', e)
    }
  }

  async getCampaignDisplay(channelId: string) {
    return this.storage.get<JJCampaignTVType>(
      `campaign:display:twitchId:${channelId}`,
    )
  }

  async getAllCampaignDisplay() {
    const map = await this.storage.list({
      prefix: `campaign:display:twitchId:`,
    })
    return Array.from(map.values()) as JJCampaignTVType[]
  }

  public getValidTwitchLogins() {
    return this.getStringArray('twitch:validLogins')
  }

  public getInvalidTwitchLogins() {
    return this.getStringArray('twitch:invalidLogins')
  }

  public async clearInvalidTwitchLogins() {
    await this.setStringArray('twitch:invalidLogins', [])
  }

  // Returns all Twitch channels (logins) referenced by current campaigns
  public async getAllTwitchLogins() {
    return this.getTwitchLoginsFromCampaigns()
  }

  public async getAllYoutubeLogins() {
    return this.getYoutubeLoginsFromCampaigns()
  }

  // GBP->EUR conversion via Google Finance
  public async fetchGBPToEURConversionRate() {
    const lastFetchedAt = await this.storage.get<number>(
      'gbp:eur:lastFetchedAt',
    )
    if (!lastFetchedAt || Date.now() - lastFetchedAt > 4 * 60 * 60 * 1000) {
      const value = await this.fetchFromRateAPI()
      if (Number.isFinite(value)) {
        await this.storage.put('gbp:eur:rate', value)
        await this.storage.put('gbp:eur:lastFetchedAt', Date.now())
      }
    }
  }

  public clear() {
    return this.storage.deleteAll()
  }

  public getCommunityCampaignsDisplay(): Promise<
    { count: number; list: JJCampaignType[] } | undefined
  > {
    return this.storage.get<{ count: number; list: JJCampaignType[] }>(
      'community:campaigns:display',
    )
  }

  // New: full list (ALL) community campaigns display
  public getCommunityCampaignsDisplayAll(): Promise<
    { count: number; list: JJCampaignType[] } | undefined
  > {
    return this.storage.get<{ count: number; list: JJCampaignType[] }>(
      'community:campaigns:display:all',
    )
  }

  public async buildAndStoreUserTags() {
    const db = getDB(this.env)
    const start = Date.now()

    // 1) Global usage per tag
    const tagUsageRows = await this.getUsedTagsWithUserCounts()
    console.log(
      'buildAndStoreUserTags',
      'tagUsageRows',
      'ms',
      Date.now() - start,
    )
    const usageMap = new Map<number, number>(
      tagUsageRows.map((r) => [r.tagId, r.usage]),
    )

    // 2) Pull all users and their tags
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
    console.log('buildAndStoreUserTags', 'rows', 'ms', Date.now() - start)

    const byUser = new Map<number, UserWithTags>()

    for (const r of rows) {
      let entry = byUser.get(r.userId)
      if (!entry) {
        entry = {
          userId: r.userId,
          tiltifySlug: r.tiltifySlug ?? null,
          tags: [],
        }
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

    // Sort by usage desc, then slug; then keep only top 3 per user
    for (const u of result) {
      u.tags.sort((a, b) => b.usage - a.usage || a.slug.localeCompare(b.slug))
      // if (u.tags.length > 3) u.tags = u.tags.slice(0, 3)
    }

    await this.storage.put('user:tags:display', result)
  }

  public getUserTagsDisplay() {
    return this.storage.get<UserWithTags[]>('user:tags:display')
  }

  public async loadAllTiltifySocials() {
    const start = Date.now()
    console.log('loadAllTiltifySocials')
    const campaigns = await this.getCampaigns()
    const slugs = campaigns.map((c => c.user.slug))
    console.log('loadAllTiltifySocials', 'slugs', slugs.length)
    console.log('loadAllTiltifySocials', 'slugs', slugs)
    // console.log('loadAllTiltifySocials', 'campaigns', campaigns.length)
    const api = new TiltifyAPI(this.env)
    const token = await api.getAppToken()
    // console.log('loadAllTiltifySocials', 'token', token)
    const users = await Promise.all(
      campaigns.map((c) => {
        return api.getUserBySlug(c.user.slug, token)
      }),
    )
      .then((r) => r.filter((u) => u !== null))
      .then((r) => r.map((u) => u.data))
    // console.log('loadAllTiltifySocials', 'users', users.length)
    await this.storage.put('socials:tiltify', users)

    const twitch = users.map((u) => u.social.twitch)
      .filter((s) => s !== undefined)
      .map((s) => this.normalizeTwitchLogin(s))

    console.log('loadAllTiltifySocials', 'twitch', twitch.length)
    console.log('loadAllTiltifySocials', 'twitch', twitch)
    await this.setStringArray('tiltify:socials:twitch', twitch)

    console.log('loadAllTiltifySocials', 'ms', Date.now() - start)
  }

  public async getTiltifyUsersMap() {
    const users = await this.getTiltifyUsers()
    return new Map(users?.map((u) => [u.slug, u]) ?? [])
  }

  async alarm(alarmInfo?: AlarmInvocationInfo) {
    console.log('DO-scheduler', 'alarm', alarmInfo)
    await this.runOverdueTasks(Date.now())
    await this.scheduleNextAlarm()
  }

  public async setTaskEnabled(name: string, enabled: boolean) {
    await this.storage.put(this.keyEnabled(name), enabled)
    await this.ensureAlarm() // recompute next alarm in case enabling/disabling changes the schedule
  }

  // Expose scheduler state for admin UI
  public async getTasksStatus() {
    const now = Date.now()
    const states = [] as Array<{
      name: string
      everyMs: number
      enabled: boolean
      lastRunMs: number | null
      nextDueAtMs: number
      dueNow: boolean
    }>
    for (const t of this.tasks) {
      const [enabled, last] = await Promise.all([
        this.isEnabled(t.name),
        this.getLastRun(t.name),
      ])
      const next = (last ?? 0) + t.everyMs
      states.push({
        name: t.name,
        everyMs: t.everyMs,
        enabled,
        lastRunMs: last ?? null,
        nextDueAtMs: next,
        dueNow: next <= now && enabled,
      })
    }
    return states
  }

  // Manually run a single task by name (updates lastRun and reschedules)
  public async runTask(name: string) {
    const t = this.tasks.find((x) => x.name === name)
    if (!t) throw new Error(`Unknown task: ${name}`)
    const start = Date.now()
    console.log('DO-scheduler', 'manual-run', name)
    await t.run()
    await this.setLastRun(name, Date.now())
    console.log('DO-scheduler', 'manual-run', name, 'ms', Date.now() - start)
    await this.scheduleNextAlarm()
  }

  // Run all overdue tasks now and reschedule
  public async runOverdueNow() {
    await this.runOverdueTasks(Date.now())
    await this.scheduleNextAlarm()
  }

  // Returns [dueNow, nextDueAtMs]
  public async getDueInfo(now: number) {
    let anyDue = false
    let nextDueAt = Number.POSITIVE_INFINITY
    const dueNames: string[] = []

    for (const t of this.tasks) {
      if (!(await this.isEnabled(t.name))) continue
      const last = await this.getLastRun(t.name)
      const next = (last ?? 0) + t.everyMs
      if (next <= now) {
        anyDue = true
        dueNames.push(t.name)
      }
      if (next < nextDueAt) nextDueAt = next
    }

    if (!Number.isFinite(nextDueAt)) {
      // If everything was disabled, try again soon (safety)
      nextDueAt = now + 60_000
    }
    return { anyDue, dueNames, nextDueAt }
  }

  // Call this once (manually or via any request) to bootstrap the first alarm
  public async ensureAlarm() {
    const existing = await this.storage.getAlarm()
    if (!existing) {
      await this.scheduleNextAlarm(1000 * 60) // start in ~1min
    }
  }

  private chunk<T>(arr: T[], size: number) {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  private async fetchFromRateAPI() {
    try {
      const url = 'https://www.google.com/finance/quote/GBP-EUR'
      const res = await fetch(url, {
        headers: {
          // Some sites return different content for bots; set a common UA
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!res.ok) {
        throw new Error(
          `Failed to fetch GBP->EUR page: ${res.status} ${res.statusText}`,
        )
      }
      const html = await res.text()

      // Look for an element that contains both classes "YMlKec" and "fxKbKc"
      const match = html.match(
        /<[^>]*class=\"[^\"]*\bYMlKec\b[^\"]*\bfxKbKc\b[^\"]*\"[^>]*>([^<]+)<\/[^>]*>/i,
      )
      if (!match) {
        throw new Error('GBP->EUR conversion rate element not found')
      }
      const rawText = match[1].trim()
      const numericText = rawText.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
      const value = parseFloat(numericText)
      if (!Number.isFinite(value)) {
        throw new Error(
          `Unable to parse GBP->EUR conversion rate from text: "${rawText}"`,
        )
      }
      return value
    } catch (e) {
      console.error(e)
      return 1
    }
  }

  // Helper: fully-qualified YouTube URL from any incoming value (channel/video URL, id, or handle)

  private async getUsedTagsWithUserCounts() {
    const db = getDB(this.env)
    return db
      .select({
        tagId: tagUserCountsView.tagId,
        tagSlug: tagUserCountsView.tagSlug,
        color: tags.color,
        usage: tagUserCountsView.userCount,
      })
      .from(tagUserCountsView)
      .leftJoin(tags, eq(tags.id, tagUserCountsView.tagId))
      .orderBy(desc(tagUserCountsView.userCount))
  }

  private normalizeTwitchLogin(input: string | undefined | null) {
    if (!input) return ''
    let s = String(input).trim().toLowerCase()
    // Remove protocol and domain prefixes
    s = s.replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '')
    s = s.replace(/^(www\.)?twitch\.tv\//i, '')
    // Take only the first path segment, drop query/fragment
    s = s.split(/[\/?#]/)[0]
    if (this.replaceMap.has(s)) {
      s = this.replaceMap.get(s) ?? ''
    }
    return s
  }

  private toCurrencies(
    gbp: number,
    usdRateIn: number,
    eurRateIn: number,
  ): CurrenciesTV {
    const usd = Math.round(gbp * usdRateIn * 100) / 100
    const euro = Math.round(gbp * eurRateIn * 100) / 100
    return {
      gbp,
      usd,
      euro,
      gbpFormatted: new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(gbp),
      usdFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(usd),
      euroFormatted: new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(euro),
    }
  }

  // Extracted from refresh: builds and stores display projections matching JJCampaignsSchema
  private async buildAndStoreCampaignsDisplay() {
    try {
      const usdRate = await this.getDollarConversionRate()
      const eurRate = await this.getGbpToEurRate()
      const tiltifyUsers = await this.getTiltifyUsersMap()
      const rawCampaigns = await this.getCampaigns()

      // Build display items for ALL campaigns
      const allDisplayList: JJCampaignTVType[] = await Promise.all(
        rawCampaigns.map(async (c) => {
          const userSlug = c.user.slug
          // console.log('buildAndStoreCampaignsDisplay', 'processing', 'userSlug', userSlug)
          let isLive = false
          try {
            const val = await this.storage.get<boolean>(
              `campaign:live:${userSlug}`,
            )
            isLive = !!val
          } catch (e) {
            console.error(
              'buildAndStoreCampaignsDisplay',
              'error getting live flag',
              'userSlug',
              userSlug,
              'error',
              e,
            )
          }

          const user = tiltifyUsers.get(userSlug)
          // console.log('buildAndStoreCampaignsDisplay', 'user', userSlug, 'user', user)
          let twitch: JJCampaignTVType['twitch'] | undefined = undefined
          const twitchSocial =
            this.tiltifySlugToTwitchLoginMap.get(userSlug) ??
            user?.social.twitch
          let login = twitchSocial
            ? this.normalizeTwitchLogin(twitchSocial)
            : ''
          // console.log('buildAndStoreCampaignsDisplay', 'twitchSocial', twitchSocial, 'login', login)
          let twitchId = ''
          if (login) {
            let twitchAvatar: string | undefined
            const tuser = await this.storage.get<any>(`twitch:login:${login}`)
            // console.log('buildAndStoreCampaignsDisplay', 'tuser', tuser)
            if (tuser) {
              twitchAvatar = (tuser as any)?.profile_image_url
              twitchId = (tuser as any)?.id ?? ''
              const displayName = (tuser as any)?.display_name
              twitch = {
                name: displayName ?? login,
                avatar: twitchAvatar ?? c.user.avatar ?? '',
                isLive,
                url: `https://twitch.tv/${login}`,
              }
            }
          }

          const display: JJCampaignTVType = {
            tiltifySlug: c.user.slug,
            campaignName: c.name,
            tiltifyUrl: c.url,
            tiltifyName: c.user.name,
            tiltifyDescription: c.description,
            tiltifyCauseId: c.causeId ? c.causeId : undefined,
            avatar: c.user.avatar ?? '',
            raised: this.toCurrencies(c.raised, usdRate, eurRate),
            goal: this.toCurrencies(c.goal, usdRate, eurRate),
            twitch,
          }
          try {
            await this.storage.put(`campaign:display:${userSlug}`, display)
            if (twitchId !== '') {
              await this.storage.put(
                `campaign:display:twitchId:${twitchId}`,
                display,
              )
              /*
              console.log(
                'buildAndStoreCampaignsDisplay',
                'storing twitchId',
                'userSlug',
                userSlug,
                'twitchId',
                twitchId,
                'twitchSocial',
                twitchSocial,
                'login',
                login,
                'display',
                display,
              )*/
            } else {
              /*
              console.log(
                'buildAndStoreCampaignsDisplay',
                'no twitchId for',
                userSlug,
                'twitchSocial',
                twitchSocial,
                'login',
                login,
                'display',
                display
              )*/
            }
          } catch (e) {
            console.error(
              'buildAndStoreCampaignsDisplay',
              'error storing',
              'userSlug',
              userSlug,
              'twitchSocial',
              twitchSocial,
              'login',
              login,
              'display',
              display,
              'error',
              e,
            )
          }
          return display
        }),
      )

      // Create TOP 100 slice by raised GBP descending
      const top100 = [...allDisplayList]
        .sort((a, b) => b.raised.gbp - a.raised.gbp)
        .slice(0, 100)

      const campaignsDisplayTop: JJCampaignsTVType = {
        count: top100.length,
        campaigns: top100,
        date: new Date(),
      }
      const campaignsDisplayAll: JJCampaignsTVType = {
        count: allDisplayList.length,
        campaigns: allDisplayList,
        date: new Date(),
      }

      // Backward compatibility: keep campaigns:display as TOP 100
      await this.storage.put('campaigns:display', campaignsDisplayTop)
      // New key with ALL campaigns
      await this.storage.put('campaigns:display:all', campaignsDisplayAll)
    } catch (e) {
      console.error('build display campaigns', e)
    }
  }

  // Build and store display projections for causes matching causesContract output
  private async buildAndStoreCausesDisplay() {
    try {
      const usdRate = await this.getDollarConversionRate()
      const eurRate = await this.getGbpToEurRate()
      const toCurrencies = (
        gbp: number,
        usdRateIn: number,
        eurRateIn: number,
      ): CurrenciesTV => {
        const usd = Math.round(gbp * usdRateIn * 100) / 100
        const euro = Math.round(gbp * eurRateIn * 100) / 100
        return {
          gbp,
          usd,
          euro,
          gbpFormatted: new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(gbp),
          usdFormatted: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(usd),
          euroFormatted: new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(euro),
        }
      }

      const rawCauses = await this.getCauses()

      const causes: JJCauseTVType[] = await Promise.all(
        rawCauses.map(async (c) => {
          const raised = toCurrencies(c.raised, usdRate, eurRate)
          return {
            id: c.id,
            name: c.name,
            logo: c.logo,
            description: c.description,
            url: c.url,
            donateUrl: c.donateUrl,
            raised: raised,
          }
        }),
      )

      await Promise.all(causes.map((c) => this.setTVCause(c)))

      /*
      const overview: CausesDisplayType['overview'] = {
        raised: {
          yogscast: toCurrencies(data.raised.yogscast, data.dollarConversionRate),
          fundraisers: toCurrencies(
            data.raised.fundraisers,
            data.dollarConversionRate,
          ),
          total: toCurrencies(
            parseFloat(
              (data.raised.fundraisers + data.raised.yogscast).toFixed(2),
            ),
            data.dollarConversionRate,
          ),
        },
        collections: data.collections,
        donations: data.donations.count,
        date: new Date(data.date),
      }
      */

      const output: CausesDisplayTVType = {
        count: causes.length,
        causes,
      }

      await this.storage.put('causes:display', output)
    } catch (e) {
      console.error('build display causes', e)
    }
  }

  // Automatically detects whether the input represents a video, channel, or handle and returns
  private async buildAndStoreCommunityCampaignsDisplay() {
    const rawCampaigns = await this.getCampaigns()
    try {
      const usdRate = await this.getDollarConversionRate()
      const eurRate = await this.getGbpToEurRate()

      const slugs = Array.from(
        new Set(
          rawCampaigns
            .map((c) => c.user?.slug)
            .filter((s): s is string => Boolean(s)),
        ),
      )

      let scheduleByTiltify = new Map<string, string>()
      const year = new Date().getFullYear()
      if (slugs.length > 0) {
        // console.log('fetching schedules for', slugs.length)
        // console.log('fetching schedules for', slugs)
        try {
          const db = getDB(this.env)
          const slugPred = or(
            ...slugs.map((s) => eq(userDisplayView.tiltifySlug, s)),
          )
          const rows = await db
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
                // If you only want to expose primary schedules uncomment:
                eq(schedulesTable.primary, true),
                // slugPred,
              ),
            )
            .all()
          scheduleByTiltify = new Map(
            rows.map((r) => [r.tiltifySlug, r.scheduleSlug]),
          )
        } catch (e) {
          console.error('schedule lookup failed', e)
        }
      }

      const userTags = await this.getUserTagsDisplay()
      let userTagsMap = new Map<string, UserWithTags>()
      if (userTags) {
        userTagsMap = new Map<string, UserWithTags>(
          userTags.map((u) => [u.tiltifySlug, u]),
        )
      }

      const tiltifyUsers = await this.getTiltifyUsersMap()

      const listAll = await Promise.all(
        rawCampaigns.map(async (c) => {
          const userSlug = c.user.slug
          const user = tiltifyUsers.get(userSlug)
          const userTwitch =
            this.tiltifySlugToTwitchLoginMap.get(userSlug) ??
            user?.social.twitch
          const userYoutube = user?.social.youtube
          const login = userTwitch
            ? this.normalizeTwitchLogin(userTwitch)
            : undefined

          let tuser = undefined

          if (login) {
            tuser = await this.storage.get<any>(`twitch:login:${login}`)
          }

          const twitchAvatar = (tuser as any)?.profile_image_url
          const twitch = userTwitch ? this.toTwitchUrl(userTwitch) : undefined

          const youtube = userYoutube
            ? this.toYouTubeUrl(userYoutube)
            : undefined

          const val = await this.storage.get<boolean>(
            `campaign:live:${c.user.slug}`,
          )
          const sSlug = userSlug ? scheduleByTiltify.get(userSlug) : undefined

          const display: JJCampaignType = {
            campaignName: c.name,
            tiltifyUrl: c.url,
            tiltifySlug: c.user.slug,
            tiltifyName: c.user.name,
            tiltifyDescription: c.description || undefined,
            tiltifyCauseId: c.causeId,
            avatar: twitchAvatar ?? c.user.avatar ?? '',
            raised: this.toCurrencies(c.raised, usdRate, eurRate),
            twitch,
            youtube,
            isTwitchLive: val ?? false,
            scheduleUrl: sSlug ? `/schedules/${sSlug}` : undefined,
            tags: userTagsMap.get(c.user.slug)?.tags ?? [],
          }

          /*
          console.log(
            'buildAndStoreCommunityCampaignsDisplay',
            'user',
            userSlug,
            'twitch',
            userTwitch,
            'login',
            login,
            'youtube',
            userYoutube,
            'user',
            user,
            'display',
            display,
          )*/

          return display
        }),
      )

      // Create TOP 100 slice by raised GBP descending
      const listTop = [...listAll]
        .sort((a, b) => b.raised.gbp - a.raised.gbp)
        .slice(0, 100)

      // Backward compatibility: keep legacy key as TOP 100
      await this.storage.put('community:campaigns:display', {
        count: listTop.length,
        list: listTop,
      })

      // New key with ALL community campaigns
      await this.storage.put('community:campaigns:display:all', {
        count: listAll.length,
        list: listAll,
      })
    } catch (e) {
      console.error('build display community campaigns', e)
    }
  }

  // Helper: fully-qualified Twitch URL from any incoming channel value
  private toTwitchUrl(input: string | null | undefined): string | undefined {
    if (!input) return undefined
    const login = this.normalizeTwitchLogin(String(input).toLowerCase())
    return login ? `https://twitch.tv/${login}` : undefined
  }

  // the appropriate canonical YouTube URL. The "type" parameter was removed; detection is inferred.
  private toYouTubeUrl(input: string | null | undefined): string | undefined {
    if (!input) return undefined
    let s = String(input).trim()
    if (!s) return undefined

    // If it's already a URL, normalize common short links and otherwise return as-is
    if (/^https?:\/\//i.test(s)) {
      try {
        const url = new URL(s)
        const host = url.hostname.toLowerCase()
        const path = url.pathname
        if (host === 'youtu.be') {
          // Short link: https://youtu.be/<videoId>
          const id = path.replace(/^\//, '').split('/')[0]
          if (/^[a-zA-Z0-9_-]{11}$/.test(id))
            return `https://www.youtube.com/watch?v=${id}`
        }
        // For other youtube.com URLs, return as-is
        return s
      } catch {
        // fall-through to ID/handle detection if URL parsing fails
      }
    }

    // Detect a YouTube video id (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) {
      return `https://www.youtube.com/watch?v=${s}`
    }

    // Detect a channel id starting with UC and length 24 (UC + 22)
    if (/^UC[a-zA-Z0-9_-]{22}$/i.test(s)) {
      return `https://www.youtube.com/channel/${s}`
    }

    // Detect a handle (with @) or treat as handle if not having @ but looks like a name
    if (s.startsWith('@')) return `https://www.youtube.com/${s}`
    // As a sane default, treat as a handle-style channel name
    return `https://www.youtube.com/@${s}`
  }

  // Key helpers
  private campaignKey(userRef: string) {
    return `campaign:api:${userRef}`
  }

  private causeKey(causeId: string) {
    return `cause:raw:${causeId}`
  }

  private causeKeyTV(causeId: string) {
    return `cause:tv:${causeId}`
  }

  // --- Start: lightweight DO scheduler ---

  private stringArrayKey(name: string) {
    return `strarr:${name}`
  }

  private async getTwitchLoginsFromCampaigns() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map(
        (c) => this.tiltifySlugToTwitchLoginMap.get(c.slug) ?? c.social.twitch,
      )
      .filter((c) => c !== undefined)
      .filter((c) => this.normalizeTwitchLogin(c)) ?? []) as string[]
  }

  private async getYoutubeLoginsFromCampaigns() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map((c) => c.social.youtube)
      .filter((c) => c !== undefined)
      .filter((c) => c) ?? []) as string[]
  }

  private getTiltifyUsers() {
    return this.storage.get<TiltifyUserData[]>('socials:tiltify')
  }

  // Storage keys
  private keyLastRun(name: string) {
    return `task:lastRun:${name}`
  }

  private keyEnabled(name: string) {
    return `task:enabled:${name}`
  }

  // Read last run (ms since epoch), undefined if never
  private async getLastRun(name: string) {
    return (await this.storage.get<number>(this.keyLastRun(name))) ?? undefined
  }

  private async setLastRun(name: string, ts: number) {
    await this.storage.put(this.keyLastRun(name), ts)
  }

  private async isEnabled(name: string) {
    const val = await this.storage.get<boolean>(this.keyEnabled(name))
    return val ?? true // default: enabled
  }

  // Run only the tasks that are currently overdue
  private async runOverdueTasks(now: number) {
    for (const t of this.tasks) {
      if (!(await this.isEnabled(t.name))) continue
      const last = await this.getLastRun(t.name)
      const next = (last ?? 0) + t.everyMs
      if (next <= now) {
        const start = Date.now()
        try {
          console.log('DO-scheduler', 'run', t.name)
          await t.run()
          await this.setLastRun(t.name, now)
          console.log('DO-scheduler', t.name, 'ms', Date.now() - start)
        } catch (e) {
          console.error('DO-scheduler', 'error', t.name, e)
          // Do not update lastRun on failure; it will retry next alarm
        }
      }
    }
  }

  // Compute and set the next alarm based on soonest next-due task
  private async scheduleNextAlarm(afterNowMs?: number) {
    const now = Date.now()
    if (afterNowMs && afterNowMs > 0) {
      await this.storage.setAlarm(now + afterNowMs)
      console.log('DO-scheduler', 'scheduleNextAlarm', now + afterNowMs)
      return
    }
    const { nextDueAt } = await this.getDueInfo(now)
    // Clamp next alarm not earlier than now + 1s to avoid tight loops
    const when = Math.max(nextDueAt, now + 1000)
    await this.storage.setAlarm(when)
    console.log('DO-scheduler', 'scheduleNextAlarm', when)
  }

  // --- End: lightweight DO scheduler ---
}

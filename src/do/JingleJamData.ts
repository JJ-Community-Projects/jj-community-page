import { DurableObject } from 'cloudflare:workers'
import { getDB } from '../lib/db/db.ts'
import type {
  JingleJamResponse,
  JJCampaign,
  JJCause,
  JJCollections,
  JJDonations,
  JJRaised,
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
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { schedulesTable } from '../lib/db/schema/jj-schema.ts'
import { userDisplayView } from '../lib/db/schema/views-schema.ts'
import { tags, userTagsTable } from '../lib/db/schema/tags-schema.ts'
import { TiltifyAPI, type TiltifyUserData } from '../lib/TiltifyAPI.ts'
import { jjCampaign, jjCauses } from '../lib/db/schema/jj-api-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'

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
  ])

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

  // Refresh from API and persist to storage and DB
  public async refresh() {
    const res = await fetch(this.env.JJ_DASHBOARD_URL)
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

    try {
      await this.setCampaigns(data.campaigns.list)
    } catch (e) {
      console.error('setCampaigns', e)
    }

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

    await this.buildDisplayData(data)
  }

  public async buildDisplayData(data: JingleJamResponse) {
    // Build and store display projections matching JJCampaignsSchema
    await this.buildAndStoreCampaignsDisplay(data)

    // Build and store display projections for causes
    await this.buildAndStoreCausesDisplay(data)

    // Build and store display projections for community campaigns
    await this.buildAndStoreCommunityCampaignsDisplay(data)
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
        if (user.social.twitch) {
          return {
            channel: this.normalizeTwitchLogin(user.social.twitch),
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

  public async getdollarConversionRate() {
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
    const raised = await this.storage.get<JJRaised>('raised')
    return raised ?? { yogscast: 0, fundraisers: 0 }
  }

  public async getCollections() {
    const collections = await this.storage.get<JJCollections>('collections')
    return collections ?? { redeemed: 0, total: 0 }
  }

  public async getDonations() {
    const donations = await this.storage.get<JJDonations>('donations')
    return donations ?? { count: 0 }
  }

  public async getDate() {
    const donations = await this.storage.get<string>('date')
    return donations ?? new Date().toISOString()
  }

  public getCampaignsDisplay(): Promise<JJCampaignsTVType | undefined> {
    return this.storage.get<JJCampaignsTVType>('campaigns:display')
  }

  public getCausesDisplay(): Promise<CausesDisplayTVType | undefined> {
    return this.storage.get<CausesDisplayTVType>('causes:display')
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
    const validLogins: string[] = []
    const invalidLogins: string[] = []

    const storedInvalidLogins = await this.getStringArray(
      'twitch:invalidLogins',
    )
    // Normalize previously stored invalid logins for proper comparison
    const storedInvalidSet = new Set(storedInvalidLogins)

    for (const login of logins) {
      const normalized = this.normalizeTwitchLogin(login)
      if (!normalized) continue

      if (storedInvalidSet.has(normalized)) {
        invalidLogins.push(normalized)
        console.log('validateTwitchChannels', 'isInvalid', normalized)
        continue
      }

      const channel = await api.fetchUsersByLogin(normalized, accessToken)

      if (channel.data && !channel.error) {
        validLogins.push(normalized)
        await this.storage.put(`twitch:id:${channel.data.id}`, channel.data)
        await this.storage.put(
          `twitch:login:${channel.data.login}`,
          channel.data,
        )
      } else {
        if (channel.error.status !== 401) {
          invalidLogins.push(normalized)
        }
      }
    }

    await this.setStringArray('twitch:validLogins', validLogins)
    await this.setStringArray('twitch:invalidLogins', invalidLogins)
  }

  public async checkLiveStreams() {
    const logins = await this.getStringArray('twitch:validLogins')
    const api = new TwitchAPI(this.env)
    const accessToken = await api.getAppToken()
    const liveStreamsIds: string[] = []
    const liveStreamsLogins: string[] = []
    for (const login of logins) {
      const stream = await api.fetchStreamsByLogin(login, accessToken)
      if (stream.data && !stream.error) {
        liveStreamsIds.push(stream.data.user_id)
        liveStreamsLogins.push(stream.data.user_login)
      }
    }
    await this.setStringArray('twitch:liveStreams:ids', liveStreamsIds)
    await this.setStringArray('twitch:liveStreams:logins', liveStreamsLogins)

    // Update per-campaign live flags based on current live logins
    try {
      const liveSet = new Set(liveStreamsLogins.map((l) => l.toLowerCase()))
      const campaigns = await this.getCampaigns()

      const users = await this.getTiltifyUsersMap()
      for (const c of campaigns) {
        const userSlug = c.user.slug
        const user = users.get(userSlug)
        if (!user) continue
        const login = user.social.twitch
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

      await this.storage.put('gbp:eur:rate', value)
      return value
    } catch (e) {
      console.error(e)
      return 1
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

  public async buildAndStoreUserTags() {
    const db = getDB(this.env)

    // 1) Global usage per tag
    const tagUsageRows = await this.getUsedTagsWithUserCounts()
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
      if (u.tags.length > 3) u.tags = u.tags.slice(0, 3)
    }

    const userMap = new Map<string, UserWithTags>(
      result.map((r) => [r.tiltifySlug, r]),
    )

    await this.storage.put('user:tags:display', userMap)
  }

  public getUserTagsDisplay() {
    return this.storage.get<{ [slug: string]: UserWithTags }>(
      'user:tags:display',
    )
  }

  public async loadAllTiltifySocials() {
    const campaigns = await this.getCampaigns()
    console.log('loadAllTiltifySocials', 'campaigns', campaigns.length)
    const api = new TiltifyAPI(this.env)
    const token = await api.getAppToken()
    console.log('loadAllTiltifySocials', 'token', token)
    const users = await Promise.all(
      campaigns.map((c) => {
        return api.getUserBySlug(c.user.slug, token)
      }),
    )
      .then((r) => r.filter((u) => u !== null))
      .then((r) => r.map((u) => u.data))
    console.log('loadAllTiltifySocials', 'users', users.length)
    await this.storage.put('socials:tiltify', users)
  }

  public async getTiltifyUsersMap() {
    const users = await this.getTiltifyUsers()
    return new Map(users?.map((u) => [u.slug, u]) ?? [])
  }

  private async getUsedTagsWithUserCounts() {
    const db = getDB(this.env)
    const usage = sql<number>`count(distinct ${userTagsTable.userId})`.as(
      'usage',
    )
    return db
      .select({
        tagId: tags.id,
        tagSlug: tags.slug,
        color: tags.color,
        usage,
      })
      .from(userTagsTable)
      .innerJoin(tags, eq(userTagsTable.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(desc(usage))
  }

  private normalizeTwitchLogin(input: string | undefined | null) {
    if (!input) return ''
    let s = String(input).trim()
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
  private async buildAndStoreCampaignsDisplay(data: JingleJamResponse) {
    try {
      const usdRate = data.dollarConversionRate
      const eurRate = await this.getGbpToEurRate()
      const tiltifyUsers = await this.getTiltifyUsersMap()

      const displayList: JJCampaignTVType[] = []
      for (const c of data.campaigns.list) {
        const userSlug = c.user.slug
        let isLive = false
        try {
          const val = await this.storage.get<boolean>(
            `campaign:live:${userSlug}`,
          )
          isLive = !!val
        } catch {}

        const user = tiltifyUsers.get(userSlug)

        let twitch: JJCampaignTVType['twitch'] | undefined = undefined
        let login = user?.social.twitch
          ? this.normalizeTwitchLogin(user!.social.twitch)
          : ''

        let twitchId = ''
        if (login) {
          let twitchAvatar: string | undefined
          const tuser = await this.storage.get<any>(`twitch:login:${login}`)
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
        displayList.push(display)
        try {
          await this.storage.put(`campaign:display:${userSlug}`, display)
          if (twitchId !== '') {
            await this.storage.put(
              `campaign:display:twitchId:${twitchId}`,
              display,
            )
          }
        } catch {}
      }

      const campaignsDisplay: JJCampaignsTVType = {
        count: displayList.length,
        campaigns: displayList,
        date: new Date(),
      }
      await this.storage.put('campaigns:display', campaignsDisplay)
    } catch (e) {
      console.error('build display campaigns', e)
    }
  }

  // Build and store display projections for causes matching causesContract output
  private async buildAndStoreCausesDisplay(data: JingleJamResponse) {
    try {
      const usdRate = data.dollarConversionRate
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

      const causes: JJCauseTVType[] = await Promise.all(
        data.causes.map(async (c) => {
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
        // overview,
      }

      await this.storage.put('causes:display', output)
    } catch (e) {
      console.error('build display causes', e)
    }
  }

  // Helper: fully-qualified YouTube URL from any incoming value (channel/video URL, id, or handle)
  // Automatically detects whether the input represents a video, channel, or handle and returns
  private async buildAndStoreCommunityCampaignsDisplay(
    data: JingleJamResponse,
  ) {
    try {
      const usdRate = data.dollarConversionRate
      const eurRate = await this.getGbpToEurRate()
      const slugs = Array.from(
        new Set(
          data.campaigns.list
            .map((c) => c.user?.slug)
            .filter((s): s is string => Boolean(s)),
        ),
      )

      let scheduleByTiltify = new Map<string, string>()
      const year = new Date().getFullYear()
      if (slugs.length > 0) {
        console.log('fetching schedules for', slugs.length)
        console.log('fetching schedules for', slugs)
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
        userTagsMap = new Map<string, UserWithTags>(Object.entries(userTags))
      }

      const rawCampaigns = data.campaigns.list
      const tiltifyUsers = await this.getTiltifyUsersMap()

      const list = await Promise.all(
        rawCampaigns.map(async (c) => {
          const userSlug = c.user.slug
          const user = tiltifyUsers.get(userSlug)
          const userTwitch = user?.social.twitch
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

          return display
        }),
      )

      await this.storage.put('community:campaigns:display', {
        count: list.length,
        list,
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

  private stringArrayKey(name: string) {
    return `strarr:${name}`
  }

  private async getTwitchLoginsFromCampaigns() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map((c) => c.social.twitch)
      .filter((c) => c !== undefined)
      .filter((c) => this.normalizeTwitchLogin(c)) ?? []) as string[]
  }

  private async getYoutubeLoginsFromCampaigns() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map((c) => c.social.twitch)
      .filter((c) => c !== undefined)
      .filter((c) => c) ?? []) as string[]
  }

  private getTiltifyUsers() {
    return this.storage.get<TiltifyUserData[]>('socials:tiltify')
  }
}

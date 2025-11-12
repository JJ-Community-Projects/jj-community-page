import { DurableObject } from 'cloudflare:workers'
import { getDB } from '../lib/db/db.ts'
import { jjCampaign, jjCauses } from '../lib/db/schema/jj-api-schema.ts'
import type {
  JingleJamResponse,
  JJCampaign,
  JJCause,
  JJCollections,
  JJDonations,
  JJRaised,
} from './types/JJAPIModel.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import { TwitchAPI } from '../lib/twitchAPI.ts'
import type {
  CausesDisplayTVType,
  CurrenciesTV,
  JJCampaignsTVType,
  JJCampaignTVType,
  JJCauseTVType,
} from '../lib/orpc/public/twitchExtension/contract.ts'
import type { JJCampaignType, SimpleCampaignTag, } from '../lib/orpc/private/jjData/contract.ts'
import { and, eq, or } from 'drizzle-orm'
import { schedulesTable } from '../lib/db/schema/jj-schema.ts'
import { userDisplayView } from '../lib/db/schema/views-schema.ts'
import { stringToNumber } from '../lib/utils/stringToNumber.ts'
import { tags, userTagsTable } from '../lib/db/schema/tags-schema.ts'

export class JingleJamData extends DurableObject<Env> {
  replaceMap: Map<string, string> = new Map([
    ['crustydoggo', 'kirsty'],
    ['bobawitch', 'boba'],
  ])

  private get storage() {
    return this.ctx.storage
  }

  // Causes
  public async setCause(cause: JJCauseTVType) {
    await this.storage.put(this.causeKey(cause.id), cause)
  }

  public async setCauses(causes: JJCause[]) {
    const entries: Record<string, JJCause> = {}
    for (const c of causes) entries[this.causeKey(c.id)] = c
    await this.storage.put(entries)
  }

  public getCause(causeId: number) {
    return this.storage.get(this.causeKey(causeId)) as Promise<
      JJCauseTVType | undefined
    >
  }

  public async getCauses() {
    const map = (await this.storage.list({ prefix: 'cause:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCauseTVType[]
  }

  // Campaigns
  public async setCampaign(campaign: JJCampaign) {
    const id = await stringToNumber(campaign.user.id)
    await this.storage.put(this.campaignKey(id), campaign)
  }

  public async setCampaigns(campaigns: JJCampaign[]) {
    const entries: Record<string, JJCampaign> = {}
    for (const c of campaigns) {
      const id = await stringToNumber(c.user.id)
      entries[this.campaignKey(id)] = c
    }
    await this.storage.put(entries)
  }

  public getCampaign(userId: number) {
    return this.storage.get(this.campaignKey(userId)) as Promise<
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

  public async getCampaignsForCause(causeId: number) {
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

    let data = (await res.json()) as JingleJamResponse
    const newCauseIds = new Map<string | number, number>()

    for (let i = 0; i < data.causes.length; i++) {
      const cause = data.causes[i]
      newCauseIds.set(cause.id, i)
    }

    data = {
      ...data,
      causes: data.causes.map((c, i) => {
        return {
          ...c,
          id: newCauseIds.get(c.id) ?? i,
        }
      }),
      campaigns: {
        count: data.campaigns.count,
        list: data.campaigns.list.map((c, i) => {
          const causeId = c.causeId ? (newCauseIds.get(c.causeId) ?? i) : null
          return {
            ...c,
            causeId: causeId,
            user: {
              ...c.user,
              id: i,
            },
          }
        }),
      },
    }

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
      await this.storage.put('avgConversionRate', data.avgConversionRate)
    } catch (e) {
      console.error('put avgConversionRate', e)
    }

    await this.buildDisplayData(data)

    try {
      const db = getDB(this.env)

      // Conservative variable ceiling (SQLite default is 999). Leave some safety headroom.
      const VARS_LIMIT = 50

      // Helper to chunk an array
      const chunk = <T>(arr: T[], size: number) => {
        const out: T[][] = []
        for (let i = 0; i < arr.length; i += size)
          out.push(arr.slice(i, i + size))
        return out
      }

      // Prepare rows
      const causeRows = await Promise.all(
        data.causes.map(async (cause) => ({
          id: await stringToNumber(cause.id),
          year: data.event.year,
          name: cause.name,
          logo: cause.logo,
          description: cause.description,
          url: cause.url,
          donateUrl: cause.donateUrl,
          raised: cause.raised,
        })),
      )

      const campaignRows = await Promise.all(
        data.campaigns.list.map(async (c) => ({
          year: data.event.year,
          causeId: c.causeId ? await stringToNumber(c.causeId!) : null,
          name: c.name,
          description: c.description,
          slug: c.slug,
          url: c.url,
          startTime: c.startTime,
          raised: c.raised,
          goal: c.goal,
          livestream: {
            channel: c.livestream?.channel ?? '',
            type: c.livestream?.type ?? '',
          },
          userId: await stringToNumber(c.user.id),
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

  public async buildDisplayData(data: JingleJamResponse) {
    // Build and store display projections matching JJCampaignsSchema
    await this.buildAndStoreCampaignsDisplay(data)

    // Build and store display projections for causes
    await this.buildAndStoreCausesDisplay(data)

    // Build and store display projections for community campaigns
    await this.buildAndStoreCommunityCampaignsDisplay(data)
  }

  public async getAvgConversionRate() {
    const avgConversionRate =
      await this.storage.get<number>('avgConversionRate')
    return avgConversionRate ?? 1
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
        // maintain idx mapping login -> userId from raw campaigns
        try {
          const campaigns = await this.getCampaigns()
          const camp = campaigns.find((c) => {
            if (c.livestream?.type !== 'twitch') return false
            const chan = this.normalizeTwitchLogin(c.livestream?.channel ?? '')
            return chan.toLowerCase() === normalized.toLowerCase()
          })
          if (camp) {
            await this.storage.put(
              `idx:twitch:login:${normalized.toLowerCase()}`,
              {
                userId: camp.user.id,
              },
            )
          }
        } catch {}
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
      for (const c of campaigns) {
        const login =
          c.livestream?.type === 'twitch' && c.livestream?.channel
            ? String(c.livestream.channel).toLowerCase()
            : ''
        if (!login) continue
        const isLive = liveSet.has(login)
        await this.storage.put(`campaign:live:${c.user.id}`, isLive)
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
      const usdRate = data.avgConversionRate
      const eurRate = await this.getGbpToEurRate()

      const displayList: JJCampaignTVType[] = []
      for (const c of data.campaigns.list) {
        const userId = c.user.id
        let isLive = false
        try {
          const val = await this.storage.get<boolean>(`campaign:live:${userId}`)
          isLive = !!val
        } catch {}

        let twitch: JJCampaignTVType['twitch'] | undefined = undefined
        let login =
          c.livestream?.type === 'twitch' && c.livestream?.channel
            ? this.normalizeTwitchLogin(
                String(c.livestream.channel).toLowerCase(),
              )
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
            // maintain index for login -> userId
            try {
              await this.storage.put(`idx:twitch:login:${login}`, { userId })
            } catch {}
          }
        }

        const display: JJCampaignTVType = {
          campaignName: c.name,
          tiltifyUrl: c.url,
          tiltifyName: c.user.name,
          tiltifyDescription: c.description,
          tiltifyCauseId: c.causeId
            ? await stringToNumber(c.causeId)
            : undefined,
          avatar: c.user.avatar ?? '',
          raised: this.toCurrencies(c.raised, usdRate, eurRate),
          goal: this.toCurrencies(c.goal, usdRate, eurRate),
          twitch,
        }
        displayList.push(display)
        try {
          await this.storage.put(`campaign:display:${userId}`, display)
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
      const usdRate = data.avgConversionRate
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
          const yog = toCurrencies(c.raised.yogscast, usdRate, eurRate)
          const fund = toCurrencies(c.raised.fundraisers, usdRate, eurRate)
          const total = toCurrencies(
            parseFloat((c.raised.fundraisers + c.raised.yogscast).toFixed(2)),
            usdRate,
            eurRate,
          )
          return {
            id: await stringToNumber(c.id),
            name: c.name,
            logo: c.logo,
            description: c.description,
            url: c.url,
            donateUrl: c.donateUrl,
            raised: {
              yogscast: yog,
              fundraisers: fund,
              total,
            },
          }
        }),
      )

      await Promise.all(causes.map((c) => this.setCause(c)))

      /*
      const overview: CausesDisplayType['overview'] = {
        raised: {
          yogscast: toCurrencies(data.raised.yogscast, data.avgConversionRate),
          fundraisers: toCurrencies(
            data.raised.fundraisers,
            data.avgConversionRate,
          ),
          total: toCurrencies(
            parseFloat(
              (data.raised.fundraisers + data.raised.yogscast).toFixed(2),
            ),
            data.avgConversionRate,
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

  private async buildAndStoreCommunityCampaignsDisplay(
    data: JingleJamResponse,
  ) {
    try {
      const usdRate = data.avgConversionRate
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
                slugPred,
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

      // Build a map: tiltifySlug -> Tag[]
      let tagsByTiltify = new Map<string, SimpleCampaignTag[]>()
      if (slugs.length > 0) {
        try {
          const db = getDB(this.env)
          const slugPred = or(
            ...slugs.map((s) => eq(userDisplayView.tiltifySlug, s)),
          )
          const tagRows = await db
            .select({
              tiltifySlug: userDisplayView.tiltifySlug,
              name: tags.name,
              slug: tags.slug,
              color: tags.color,
            })
            .from(userDisplayView)
            .innerJoin(
              userTagsTable,
              eq(userTagsTable.userId, userDisplayView.userId),
            )
            .innerJoin(tags, eq(tags.id, userTagsTable.tagId))
            .where(slugPred)
            .all()

          for (const r of tagRows) {
            const list = tagsByTiltify.get(r.tiltifySlug) ?? []
            list.push({ name: r.name, slug: r.slug, color: r.color })
            tagsByTiltify.set(r.tiltifySlug, list)
          }
        } catch (e) {
          console.error('tags lookup failed', e)
        }
      }

      const list = await Promise.all(
        data.campaigns.list.map(async (c) => {
          const login =
            c.livestream?.type === 'twitch'
              ? this.normalizeTwitchLogin(c.livestream?.channel)
              : undefined

          let tuser = undefined

          if (login) {
            tuser = await this.storage.get<any>(`twitch:login:${login}`)
          }

          const twitchAvatar = (tuser as any)?.profile_image_url
          const twitch =
            c.livestream?.type === 'twitch'
              ? this.toTwitchUrl(c.livestream?.channel)
              : undefined

          const youtube = c.livestream?.type?.includes('youtube')
            ? this.toYouTubeUrl(c.livestream?.type, c.livestream?.channel)
            : undefined
          const val = await this.storage.get<boolean>(
            `campaign:live:${c.user.id}`,
          )
          const sSlug = c.user?.slug
            ? scheduleByTiltify.get(c.user.slug)
            : undefined

          const display: JJCampaignType = {
            campaignName: c.name,
            tiltifyUrl: c.url,
            tiltifyName: c.user.name,
            tiltifyDescription: c.description || undefined,
            tiltifyCauseId: c.causeId
              ? await stringToNumber(c.causeId)
              : undefined,
            avatar: twitchAvatar ?? c.user.avatar ?? '',
            raised: this.toCurrencies(c.raised, usdRate, eurRate),
            twitch,
            youtube,
            isTwitchLive: val ?? false,
            scheduleUrl: sSlug ? `/schedules/${sSlug}` : undefined,
            tags: tagsByTiltify.get(c.user.slug) ?? [],
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

  // Helper: fully-qualified YouTube URL based on livestream type and channel value
  private toYouTubeUrl(
    type: string | undefined,
    channel: string | null | undefined,
  ): string | undefined {
    if (!channel) return undefined
    const c = String(channel).trim()
    // If already a URL, return as-is (basic sanity check)
    if (/^https?:\/\//i.test(c)) return c

    if (!type) return undefined
    if (type === 'youtube_live') {
      // We receive a channel id (often starting with UC...) or a handle; prefer channel URL
      // UC* indicates channel id; otherwise treat as handle or custom id
      if (/^UC[a-zA-Z0-9_-]{22}$/i.test(c)) {
        return `https://www.youtube.com/channel/${c}`
      }
      // Handles or custom channel names
      if (c.startsWith('@')) return `https://www.youtube.com/${c}`
      return `https://www.youtube.com/@${c}`
    }
    if (type === 'youtube_video') {
      // Channel field contains a video id; form a watch URL
      return `https://www.youtube.com/watch?v=${c}`
    }
    return undefined
  }

  // Key helpers
  private campaignKey(userId: number | string) {
    return `campaign:api:${userId}`
  }

  private causeKey(causeId: number | string) {
    return `cause:${causeId}`
  }

  private stringArrayKey(name: string) {
    return `strarr:${name}`
  }

  private async getTwitchLoginsFromCampaigns() {
    const campaigns = await this.getCampaigns()
    return campaigns
      .filter((c) => c.livestream?.type === 'twitch')
      .map((c) => c.livestream?.channel)
      .filter((c) => c !== null)
      .filter((c) => this.normalizeTwitchLogin(c)) as string[]
  }

  private async getYoutubeLoginsFromCampaigns() {
    const campaigns = await this.getCampaigns()
    return campaigns
      .filter((c) => c.livestream?.type.includes('youtube'))
      .map((c) => c.livestream?.channel)
      .filter((c) => c !== null)
      .filter((c) => c) as string[]
  }
}

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
  CausesDisplayType,
  Currencies,
  JJCampaignsType,
  JJCampaignType,
  JJCauseType,
} from '../lib/orpc/public/twitchExtension/contract.ts'

export class JingleJamData extends DurableObject<Env> {
  private get storage() {
    return this.ctx.storage
  }

  // Causes
  public async setCause(cause: JJCause) {
    await this.storage.put(this.causeKey(cause.id), cause)
  }

  public async setCauses(causes: JJCause[]) {
    const entries: Record<string, JJCause> = {}
    for (const c of causes) entries[this.causeKey(c.id)] = c
    await this.storage.put(entries)
  }

  public getCause(causeId: number) {
    return this.storage.get(this.causeKey(causeId)) as Promise<
      JJCause | undefined
    >
  }

  public async getCauses() {
    const map = (await this.storage.list({ prefix: 'cause:' })) as Map<
      string,
      unknown
    >
    const causes = Array.from(map.values()) as JJCause[]
    return causes
  }

  // Campaigns
  public async setCampaign(campaign: JJCampaign) {
    await this.storage.put(this.campaignKey(campaign.user.id), campaign)
  }

  public async setCampaigns(campaigns: JJCampaign[]) {
    const entries: Record<string, JJCampaign> = {}
    for (const c of campaigns) entries[this.campaignKey(c.user.id)] = c
    await this.storage.put(entries)
  }

  public getCampaign(userId: number) {
    return this.storage.get(this.campaignKey(userId)) as Promise<
      JJCampaign | undefined
    >
  }

  public async getCampaigns() {
    const map = (await this.storage.list({ prefix: 'campaign:' })) as Map<
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
      await this.storage.put('avgConversionRate', data.avgConversionRate)
    } catch (e) {
      console.error('put avgConversionRate', e)
    }

    // Build and store display projections matching JJCampaignsSchema
    await this.buildAndStoreCampaignsDisplay(data)

    // Build and store display projections for causes
    await this.buildAndStoreCausesDisplay(data)

    try {
      const db = getDB(this.env)

      // Conservative variable ceiling (SQLite default is 999). Leave some safety headroom.
      const VARS_LIMIT = 100

      // Helper to chunk an array
      const chunk = <T>(arr: T[], size: number) => {
        const out: T[][] = []
        for (let i = 0; i < arr.length; i += size)
          out.push(arr.slice(i, i + size))
        return out
      }

      // Prepare rows
      const causeRows = data.causes.map((cause) => ({
        id: cause.id,
        year: data.event.year,
        name: cause.name,
        logo: cause.logo,
        description: cause.description,
        url: cause.url,
        donateUrl: cause.donateUrl,
        raised: cause.raised,
      }))

      const campaignRows = data.campaigns.list.map((c) => ({
        year: data.event.year,
        causeId: c.causeId,
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
        userId: c.user.id,
        userName: c.user.name,
        userSlug: c.user.slug,
        userAvatar: c.user.avatar,
        userUrl: c.user.url,
      }))

      // Estimate columns per row (must match the values object shape)
      const CAUSE_COLS = 8
      const CAMPAIGN_COLS = 16 // adjust to exact count if different

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

  public async getAvgConversionRate() {
    const avgConversionRate =
      await this.storage.get<number>('avgConversionRate')
    return avgConversionRate ?? 1
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

  public getCampaignsDisplay(): Promise<JJCampaignsType | undefined> {
    return this.storage.get<JJCampaignsType>('campaigns:display')
  }

  public getCausesDisplay(): Promise<CausesDisplayType | undefined> {
    return this.storage.get<CausesDisplayType>('causes:display')
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
    const validLogins = []
    const invalidLogins = []
    const storedInvalidLogins = await this.getStringArray(
      'twitch:invalidLogins',
    )
    for (const login of logins) {
      if (storedInvalidLogins.includes(login)) {
        invalidLogins.push(login)
        continue
      }
      const channel = await api.fetchUsersByLogin(login, accessToken)
      console.log('processTwitchChannels', login, channel)
      if (channel.data && !channel.error) {
        validLogins.push(login)
        await this.storage.put(`twitch:id:${channel.data.id}`, channel.data)
        await this.storage.put(
          `twitch:login:${channel.data.login}`,
          channel.data,
        )
        // maintain idx mapping login -> userId from raw campaigns
        try {
          const campaigns = await this.getCampaigns()
          const camp = campaigns.find(
            (c) =>
              c.livestream?.type === 'twitch' &&
              (c.livestream.channel ?? '').toLowerCase() ===
                login.toLowerCase(),
          )
          if (camp) {
            await this.storage.put(`idx:twitch:login:${login.toLowerCase()}`, {
              userId: camp.user.id,
            })
          }
        } catch {}
      } else {
        invalidLogins.push(login)
      }
    }
    console.log('validLogins', validLogins)
    console.log('invalidLogins', invalidLogins)
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
      console.log('checkLiveStreams', login, stream)
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
    return this.storage.get<JJCampaignType>(
      `campaign:display:twitchId:${channelId}`,
    )
  }

  // Extracted from refresh: builds and stores display projections matching JJCampaignsSchema
  private async buildAndStoreCampaignsDisplay(data: JingleJamResponse) {
    try {
      const toCurrencies = (gbp: number, avgRate: number): Currencies => {
        const usd = Math.round(gbp * avgRate * 100) / 100
        return {
          gbp,
          usd,
          gbpFormatted: new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(gbp),
          usdFormatted: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(usd),
        }
      }

      const displayList: JJCampaignType[] = []
      for (const c of data.campaigns.list) {
        const userId = c.user.id
        let isLive = false
        try {
          const val = await this.storage.get<boolean>(`campaign:live:${userId}`)
          isLive = !!val
        } catch {}

        let twitch: JJCampaignType['twitch'] | undefined = undefined
        const login =
          c.livestream?.type === 'twitch' && c.livestream?.channel
            ? String(c.livestream.channel).toLowerCase()
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

        const display: JJCampaignType = {
          campaignName: c.name,
          tiltifyUrl: c.url,
          tiltifyName: c.user.name,
          tiltifyDescription: c.description,
          avatar: c.user.avatar ?? '',
          raised: toCurrencies(c.raised, data.avgConversionRate),
          goal: toCurrencies(c.goal, data.avgConversionRate),
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

      const campaignsDisplay: JJCampaignsType = {
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
      const toCurrencies = (gbp: number, avgRate: number): Currencies => {
        const usd = Math.round(gbp * avgRate * 100) / 100
        return {
          gbp,
          usd,
          gbpFormatted: new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(gbp),
          usdFormatted: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(usd),
        }
      }

      const causes: JJCauseType[] = data.causes.map((c) => {
        const yog = toCurrencies(c.raised.yogscast, data.avgConversionRate)
        const fund = toCurrencies(c.raised.fundraisers, data.avgConversionRate)
        const total = toCurrencies(
          parseFloat((c.raised.fundraisers + c.raised.yogscast).toFixed(2)),
          data.avgConversionRate,
        )
        return {
          id: c.id,
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
      })

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

      const output: CausesDisplayType = {
        count: causes.length,
        causes,
        overview,
      }

      await this.storage.put('causes:display', output)
    } catch (e) {
      console.error('build display causes', e)
    }
  }

  // Key helpers
  private campaignKey(userId: number) {
    return `campaign:${userId}`
  }

  private causeKey(causeId: number) {
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
      .filter((c) => c) as string[]
  }
}

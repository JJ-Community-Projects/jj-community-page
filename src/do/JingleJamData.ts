import { DurableObject } from 'cloudflare:workers'
import { getDB } from '../lib/db/db.ts'
import { jjCampaign, jjCauses } from '../lib/db/schema/jj-api-schema.ts'
import type { JingleJamResponse, JJCampaign, JJCause, } from './types/JJAPIModel.ts'
import type { BatchItem } from 'drizzle-orm/batch'

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
    console.log('getCauses', map)
    const causes = Array.from(map.values()) as JJCause[]
    console.log('getCauses', causes)
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
    console.log('getCampaigns', map)
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

    // console.log('data', data)

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
    const avgConversionRate = await this.storage.get<number>('avgConversionRate')
    return avgConversionRate ?? 1
  }

  // Key helpers
  private campaignKey(userId: number) {
    return `campaign:${userId}`
  }

  private causeKey(causeId: number) {
    return `cause:${causeId}`
  }
}

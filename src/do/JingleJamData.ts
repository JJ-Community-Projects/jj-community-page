import { DurableObject } from 'cloudflare:workers'
import { getDB } from '../lib/db/db.ts'
import { jjCampaign, jjCauses } from '../lib/db/schema/jj-api-schema.ts'
import type {
  JingleJamResponse,
  JJCampaign,
  JJCause,
} from './types/JJAPIModel.ts'

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
    return Array.from(map.values()) as JJCause[]
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
    await this.setCauses(data.causes)
    await this.setCampaigns(data.campaigns.list)

    // Store event metadata as separate keys
    await this.storage.put('event:year', data.event.year)
    await this.storage.put('raised', data.raised)
    await this.storage.put('collections', data.collections)
    await this.storage.put('donations', data.donations)

    // Persist to DB as well
    const db = getDB(this.env)
    await db.batch([
      db.insert(jjCauses).values(
        data.causes.map((cause) => ({
          id: cause.id,
          year: data.event.year,
          name: cause.name,
          logo: cause.logo,
          description: cause.description,
          url: cause.url,
          donateUrl: cause.donateUrl,
          raised: cause.raised,
        })),
      ),
      db.insert(jjCampaign).values(
        data.campaigns.list.map((c) => ({
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
        })),
      ),
    ])
  }

  // Key helpers
  private campaignKey(userId: number) {
    return `campaign:${userId}`
  }

  private causeKey(causeId: number) {
    return `cause:${causeId}`
  }
}

import { getDB } from '../../lib/db/db.ts'
import type {
  JingleJamCampaignsResponse,
  JingleJamResponse,
  JJCampaign,
  JJCause,
  JJCollections,
} from '../types/JJAPIModel.ts'
import { TiltifyAPI, type TiltifyUserData } from '../../lib/TiltifyAPI.ts'
import { jjCampaign, jjCauses } from '../../lib/db/schema/jj-api-schema.ts'
import type { BatchItem } from 'drizzle-orm/batch'
import { eq } from 'drizzle-orm'
import { accounts } from '../../lib/db/schema/auth-schema.ts'
import {
  normalizeTwitchLogin,
  tiltifySlugToTwitchLoginMap,
} from '../utils/twitchLogins.ts'
import { chunk } from '../utils/chunk.ts'
import type { CurrencyStore } from './CurrencyStore.ts'

// Source-of-truth cache for Jingle Jam API data: campaigns, causes, event
// metadata, per-campaign goal tracking and Tiltify user/social records. Also
// persists derived rows to D1.
//
// Owns storage keys: `campaign:api:*`, `campaign-goal:api:*`,
// `campaign-previous-goal:api:*`, `cause:raw:*`, `socials:tiltify`,
// `strarr:tiltify:socials:twitch`, and event metadata (`date`, `event:year`,
// `raised`, `collections`, `donations`).
export class TiltifyStore {
  constructor(
    private storage: DurableObjectStorage,
    private env: Env,
    private currency: CurrencyStore,
  ) {}

  // --- Causes ---
  public async setCauses(causes: JJCause[]) {
    const entries: Record<string, JJCause> = {}
    for (const c of causes) entries[this.causeKey(c.id)] = c
    await this.storage.put(entries)
  }

  public getCause(causeId: string) {
    return this.storage.get(this.causeKey(causeId)) as Promise<
      JJCause | undefined
    >
  }

  public async getCauses() {
    const map = (await this.storage.list({ prefix: 'cause:raw:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCause[]
  }

  // --- Campaigns ---
  public async setCampaign(campaign: JJCampaign) {
    await this.storage.put(this.campaignKeyId(campaign.id), campaign)
    await this.storage.put(this.campaignKey(campaign.id), campaign)
  }

  public async setCampaigns(campaigns: JJCampaign[]) {
    const entries: Record<string, JJCampaign> = {}
    for (const c of campaigns) {
      entries[this.campaignKeyId(c.id)] = c
      entries[this.campaignKey(c.slug)] = c
      entries[this.campaignKeyUserSlug(c.user.slug)] = c
    }
    await this.storage.put(entries)
  }

  public async getCampaign(userRef: string) {
    const campaign = await this.storage.get<JJCampaign>(
      this.campaignKey(userRef),
    )
    if (campaign) {
      return campaign
    }
    return this.storage.get(this.campaignKeyId(userRef)) as Promise<
      JJCampaign | undefined
    >
  }

  public getCampaignBySlug(slug: string) {
    return this.storage.get(`campaign:slug:${slug}`) as Promise<
      JJCampaign | undefined
    >
  }

  public getCampaignByUserSlug(slug: string) {
    return this.storage.get(`campaign:api:user-slug:${slug}`) as Promise<
      JJCampaign | undefined
    >
  }

  public async getCampaigns() {
    const map = (await this.storage.list({
      prefix: 'campaign:api:slug:',
    })) as Map<string, unknown>
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
      await this.updateGoalsAfterSetCampaigns(all)
    } catch (e) {
      console.error('refreshAllCampaigns failed', e)
      // Best-effort: still persist whatever we have
      if (all.length > 0) {
        try {
          await this.setCampaigns(all)
          await this.updateGoalsAfterSetCampaigns(all)
        } catch (e2) {
          console.error('refreshAllCampaigns setCampaigns partial failed', e2)
        }
      }
    }
  }

  // Refresh causes + event metadata from the JJ API. Pushes the USD conversion
  // rate to the CurrencyStore (custodian of that rate).
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

    // Store event metadata in a single batched write
    try {
      await this.storage.put({
        'date': data.date,
        'event:year': data.event.year,
        'raised': data.raised,
        'collections': data.collections,
        'donations': data.donations,
      })
    } catch (e) {
      console.error('put metadata', e)
    }

    // The USD rate piggy-backs on the JJ response but is owned by CurrencyStore.
    try {
      await this.currency.setDollarConversionRate(data.dollarConversionRate)
    } catch (e) {
      console.error('setDollarConversionRate', e)
    }
  }

  public async insertIntoDB() {
    const causes = await this.getCauses()
    const campaigns = await this.getCampaigns()
    const year = await this.storage.get<number>('event:year')
    try {
      const db = getDB(this.env)

      // Conservative variable ceiling (SQLite default is 999). Leave some safety headroom.
      const VARS_LIMIT = 5

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
          tiltifySlugToTwitchLoginMap.get(slug) ?? user.social.twitch
        if (twitch) {
          return {
            channel: normalizeTwitchLogin(twitch),
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

  // --- Event metadata getters ---
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

  // --- Goals ---
  public async getGoalByUserSlug(slug: string): Promise<number> {
    const value = await this.storage.get<number>(
      this.campaignGoalKeyUserSlug(slug),
    )
    return value ?? 0
  }

  public async getPreviousGoalByUserSlug(slug: string): Promise<number> {
    const value = await this.storage.get<number>(
      this.campaignPreviousGoalKeyUserSlug(slug),
    )
    return value ?? 0
  }

  private async updateGoalsAfterSetCampaigns(campaigns: JJCampaign[]) {
    const writes: Record<string, number> = {}

    for (const c of campaigns) {
      const id = c.id
      const slug = c.slug
      const userSlug = c.user?.slug
      const newGoal = c.goal

      // Read the canonical current goal by id; we will write all variants
      const current = await this.storage.get<number>(this.campaignGoalKeyId(id))

      if (typeof current === 'number') {
        if (current !== newGoal) {
          // shift current -> previous for all refs, then set new current for all refs
          writes[this.campaignPreviousGoalKeyId(id)] = current
          writes[this.campaignGoalKeyId(id)] = newGoal

          if (slug) {
            writes[this.campaignPreviousGoalKey(slug)] = current
            writes[this.campaignGoalKey(slug)] = newGoal
          }
          if (userSlug) {
            writes[this.campaignPreviousGoalKeyUserSlug(userSlug)] = current
            writes[this.campaignGoalKeyUserSlug(userSlug)] = newGoal
          }
        }
        // unchanged: no writes
      } else {
        // First time: initialize current for all refs; do not set previous
        writes[this.campaignGoalKeyId(id)] = newGoal
        if (slug) writes[this.campaignGoalKey(slug)] = newGoal
        if (userSlug) writes[this.campaignGoalKeyUserSlug(userSlug)] = newGoal
      }
    }

    if (Object.keys(writes).length > 0) {
      await this.storage.put(writes)
    }
  }

  // --- Tiltify socials / users ---
  public async loadAllTiltifySocials() {
    const campaigns = await this.getCampaigns()
    const api = new TiltifyAPI(this.env)
    const token = await api.getAppToken()
    if (!token) {
      console.error('loadAllTiltifySocials', 'no token')
      return
    }
    const users = await Promise.all(
      campaigns.map((c) => {
        return api.getUserBySlug(c.user.slug, token)
      }),
    )
      .then((r) => r.filter((u) => u !== null))
      .then((r) => r.map((u) => u.data))
    await this.storage.put('socials:tiltify', users)

    const twitch = users
      .map((u) => u.social.twitch)
      .filter((s) => s !== undefined)
      .map((s) => normalizeTwitchLogin(s))
      .filter((s) => s.length > 0)

    await this.storage.put('strarr:tiltify:socials:twitch', twitch)
  }

  public getTiltifyUsers() {
    return this.storage.get<TiltifyUserData[]>('socials:tiltify')
  }

  public async getTiltifyUsersMap() {
    const users = await this.getTiltifyUsers()
    return new Map(users?.map((u) => [u.slug, u]) ?? [])
  }

  // Returns all Twitch channels (logins) referenced by current campaigns
  public async getAllTwitchLogins() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map((c) => tiltifySlugToTwitchLoginMap.get(c.slug) ?? c.social.twitch)
      .filter((c) => c !== undefined)
      .filter((c) => normalizeTwitchLogin(c)) ?? []) as string[]
  }

  public async getAllYoutubeLogins() {
    const users = await this.getTiltifyUsers()
    return (users
      ?.map((c) => c.social.youtube)
      .filter((c) => c !== undefined)
      .filter((c) => c) ?? []) as string[]
  }

  public async updateTiltifyProfiles() {
    const db = getDB(this.env)
    const accountsList = await db
      .select()
      .from(accounts)
      .where(eq(accounts.provider, 'tiltify'))
      .all()
    const api = new TiltifyAPI(this.env)
    const token = await api.getAppToken()
    if (!token) {
      console.error('updateTiltifyProfiles', 'no token')
      return
    }
    for (const account of accountsList) {
      const tiltifyId = account.providerId
      const tiltifyUser = await api.getUserById(tiltifyId, token)
      try {
        if (tiltifyUser) {
          await db
            .update(accounts)
            .set({
              providerUsername: tiltifyUser.data.username,
              meta: tiltifyUser.data,
            })
            .where(eq(accounts.userId, account.userId))
          console.log(
            'DO-scheduler',
            'updated tiltify profile',
            tiltifyUser.data.slug,
          )
        }
      } catch (e) {
        console.error('updateTiltifyProfiles', 'error', e)
      }
    }
  }

  // --- Storage key builders ---
  private campaignKey(userRef: string) {
    return `campaign:api:slug:${userRef}`
  }

  private campaignKeyUserSlug(userRef: string) {
    return `campaign:api:user-slug:${userRef}`
  }

  private campaignKeyId(userRef: string) {
    return `campaign:api:id:${userRef}`
  }

  private campaignGoalKey(userRef: string) {
    return `campaign-goal:api:slug:${userRef}`
  }

  private campaignGoalKeyUserSlug(userRef: string) {
    return `campaign-goal:api:user-slug:${userRef}`
  }

  private campaignGoalKeyId(userRef: string) {
    return `campaign-goal:api:id:${userRef}`
  }

  private campaignPreviousGoalKey(userRef: string) {
    return `campaign-previous-goal:api:slug:${userRef}`
  }

  private campaignPreviousGoalKeyUserSlug(userRef: string) {
    return `campaign-previous-goal:api:user-slug:${userRef}`
  }

  private campaignPreviousGoalKeyId(userRef: string) {
    return `campaign-previous-goal:api:id:${userRef}`
  }

  private causeKey(causeId: string) {
    return `cause:raw:${causeId}`
  }
}

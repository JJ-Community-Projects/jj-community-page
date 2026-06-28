import type { JJCampaign, JJCause, JJCollections } from '../types/JJAPIModel.ts'
import type {
  CausesDisplayTVType,
  JJCampaignsTVType,
  JJCampaignTVType,
  JJCauseTVType,
} from '../../lib/orpc/public/twitchExtension/contract.ts'
import type {
  FullCommunitySchedule,
  JJCampaignType,
} from '../../lib/orpc/private/jjData/contract.ts'
import {
  init as initSchema,
  SET_META,
  UPSERT_CAMPAIGN,
  UPSERT_CAUSE,
  type CampaignRow,
  type CauseRow,
} from './schema.ts'
import {
  toCampaignTV,
  toCauseTV,
  toCommunityCampaign,
  toRawCampaign,
  toRawCause,
  type UserWithTags,
} from './projections.ts'

const TOP_LIMIT = 100
const FULL_SCHEDULE_KEY = 'v2:fullSchedule'

// Resolved twitch identity for a single login.
export interface TwitchResolved {
  login: string
  id: string
  name: string
  avatar: string
}

// Social handles resolved for one campaign during syncSocials.
export interface SocialUpdate {
  id: string
  twitchLogin: string
  youtubeUrl: string | null
}

// The single source of truth: SQLite reads/writes over `ctx.storage.sql`, plus
// the few Date-bearing projections kept in DO KV storage. Public read shapes
// are pure functions of the rows, memoized by a `version` counter that bumps on
// every write.
export class Store {
  private sql: SqlStorage
  private memoCache = new Map<string, { v: number; val: unknown }>()

  constructor(private storage: DurableObjectStorage) {
    this.sql = storage.sql
    initSchema(this.sql)
  }

  // --- version / memo ---
  private currentVersion(): number {
    const row = this.sql
      .exec("SELECT value FROM meta WHERE key = 'version'")
      .toArray()[0] as { value: string } | undefined
    return row ? Number(row.value) : 0
  }

  private bumpVersion() {
    const next = this.currentVersion() + 1
    this.sql.exec(SET_META, 'version', String(next))
    this.sql.exec(SET_META, 'built_at', new Date().toISOString())
  }

  private memo<T>(key: string, fn: () => T): T {
    const v = this.currentVersion()
    const cached = this.memoCache.get(key)
    if (cached && cached.v === v) return cached.val as T
    const val = fn()
    this.memoCache.set(key, { v, val })
    return val
  }

  // --- meta helpers ---
  private getMeta(key: string): string | undefined {
    const row = this.sql
      .exec('SELECT value FROM meta WHERE key = ?', key)
      .toArray()[0] as { value: string } | undefined
    return row?.value
  }

  private setMeta(key: string, value: string) {
    this.sql.exec(SET_META, key, value)
  }

  // --- row readers ---
  private allCampaignRows(): CampaignRow[] {
    return this.sql
      .exec('SELECT * FROM campaign ORDER BY raised DESC')
      .toArray() as unknown as CampaignRow[]
  }

  private allCauseRows(): CauseRow[] {
    return this.sql
      .exec('SELECT * FROM cause')
      .toArray() as unknown as CauseRow[]
  }

  private campaignRowBy(column: string, value: string): CampaignRow | undefined {
    return this.sql
      .exec(`SELECT * FROM campaign WHERE ${column} = ? LIMIT 1`, value)
      .toArray()[0] as unknown as CampaignRow | undefined
  }

  private rates(): { usd: number; eur: number } {
    const usd = Number(this.getMeta('usd_rate') ?? 1)
    const eur = Number(this.getMeta('eur_rate') ?? 1)
    return {
      usd: Number.isFinite(usd) ? usd : 1,
      eur: Number.isFinite(eur) ? eur : 1,
    }
  }

  private builtAt(): Date {
    const v = this.getMeta('built_at')
    return v ? new Date(v) : new Date()
  }

  // ============================ WRITERS ============================

  // Event meta + USD rate from /api/tiltify, and the causes set.
  upsertEvent(
    causes: JJCause[],
    meta: {
      date: string
      year: number
      raised: number
      collections: JJCollections
      donations: number
      usdRate: number
    },
  ) {
    this.storage.transactionSync(() => {
      const keptIds = new Set(causes.map((c) => c.id))
      for (const c of causes) {
        this.sql.exec(
          UPSERT_CAUSE,
          c.id,
          meta.year,
          c.name,
          c.logo,
          c.description,
          c.url,
          c.donateUrl,
          c.raised,
        )
      }
      // reconcile removed causes
      for (const row of this.allCauseRows()) {
        if (!keptIds.has(row.id)) this.sql.exec('DELETE FROM cause WHERE id = ?', row.id)
      }
      this.setMeta('date', meta.date)
      this.setMeta('year', String(meta.year))
      this.setMeta('raised', String(meta.raised))
      this.setMeta('collections', JSON.stringify(meta.collections))
      this.setMeta('donations', String(meta.donations))
      if (Number.isFinite(meta.usdRate)) this.setMeta('usd_rate', String(meta.usdRate))
      this.bumpVersion()
    })
  }

  // Campaigns from /api/campaigns, with the previous_goal diff folded onto the
  // row and removed campaigns reconciled away.
  upsertCampaigns(campaigns: JJCampaign[], year: number) {
    this.storage.transactionSync(() => {
      // existing goal state for the diff
      const existing = new Map<string, { goal: number; previous: number }>()
      for (const r of this.sql
        .exec('SELECT id, goal, previous_goal FROM campaign')
        .toArray() as unknown as Array<{
        id: string
        goal: number
        previous_goal: number
      }>) {
        existing.set(r.id, { goal: r.goal, previous: r.previous_goal })
      }

      const keptIds = new Set(campaigns.map((c) => c.id))
      for (const c of campaigns) {
        const prev = existing.get(c.id)
        let previousGoal = 0
        if (prev) {
          previousGoal = prev.goal !== c.goal ? prev.goal : prev.previous
        }
        this.sql.exec(
          UPSERT_CAMPAIGN,
          c.id,
          year,
          c.slug,
          c.user.slug,
          c.causeId,
          c.name,
          c.description,
          c.url,
          c.startTime ?? '',
          c.raised,
          c.goal,
          previousGoal,
          c.user.name,
          c.user.avatar,
          c.user.url,
        )
      }
      for (const id of existing.keys()) {
        if (!keptIds.has(id)) this.sql.exec('DELETE FROM campaign WHERE id = ?', id)
      }
      this.bumpVersion()
    })
  }

  // syncSocials: twitch login + youtube handle resolved per campaign.
  setSocials(updates: SocialUpdate[]) {
    this.storage.transactionSync(() => {
      for (const u of updates) {
        this.sql.exec(
          'UPDATE campaign SET twitch_login = ?, youtube_url = ? WHERE id = ?',
          u.twitchLogin,
          u.youtubeUrl,
          u.id,
        )
      }
      this.bumpVersion()
    })
  }

  // validateTwitch: resolved twitch id/name/avatar per login + the invalid set.
  setTwitchResolved(resolved: TwitchResolved[], invalidLogins: string[]) {
    this.storage.transactionSync(() => {
      for (const r of resolved) {
        this.sql.exec(
          'UPDATE campaign SET twitch_id = ?, twitch_name = ?, twitch_avatar = ? WHERE twitch_login = ?',
          r.id,
          r.name,
          r.avatar,
          r.login,
        )
      }
      this.setMeta('invalid_twitch_logins', JSON.stringify(invalidLogins))
      this.bumpVersion()
    })
  }

  // checkLive: which twitch logins are currently live -> is_live column.
  setLive(liveLogins: string[]) {
    const liveSet = new Set(liveLogins.map((l) => l.toLowerCase()))
    this.storage.transactionSync(() => {
      this.sql.exec('UPDATE campaign SET is_live = 0')
      for (const login of liveSet) {
        this.sql.exec(
          'UPDATE campaign SET is_live = 1 WHERE twitch_login = ?',
          login,
        )
      }
      this.bumpVersion()
    })
  }

  setGbpToEur(rate: number) {
    this.storage.transactionSync(() => {
      this.setMeta('eur_rate', String(rate))
      this.setMeta('eur_rate_at', String(Date.now()))
      this.bumpVersion()
    })
  }

  getEurRateAge(): number | null {
    const at = this.getMeta('eur_rate_at')
    return at ? Date.now() - Number(at) : null
  }

  setUserTags(tags: UserWithTags[]) {
    this.storage.transactionSync(() => {
      this.setMeta('user_tags', JSON.stringify(tags))
      this.bumpVersion()
    })
  }

  setScheduleSlugs(map: Map<string, string>) {
    this.storage.transactionSync(() => {
      this.setMeta('schedule_slugs', JSON.stringify(Array.from(map)))
      this.bumpVersion()
    })
  }

  // Date-bearing projection — kept in DO KV storage to preserve Date objects.
  async setFullSchedule(schedule: FullCommunitySchedule) {
    await this.storage.put(FULL_SCHEDULE_KEY, schedule)
  }

  // ============================ READERS ============================

  // raw campaigns
  getCampaign(userRef: string): JJCampaign | undefined {
    const row =
      this.campaignRowBy('slug', userRef) ?? this.campaignRowBy('id', userRef)
    return row ? toRawCampaign(row) : undefined
  }

  getCampaignBySlug(slug: string): JJCampaign | undefined {
    const row = this.campaignRowBy('slug', slug)
    return row ? toRawCampaign(row) : undefined
  }

  getCampaignByUserSlug(slug: string): JJCampaign | undefined {
    const row = this.campaignRowBy('user_slug', slug)
    return row ? toRawCampaign(row) : undefined
  }

  getCampaigns(): JJCampaign[] {
    return this.memo('rawCampaigns', () =>
      this.allCampaignRows().map(toRawCampaign),
    )
  }

  getCampaignsForCause(causeId: string): JJCampaign[] {
    return (
      this.sql
        .exec(
          'SELECT * FROM campaign WHERE cause_id = ? ORDER BY raised DESC',
          causeId,
        )
        .toArray() as unknown as CampaignRow[]
    ).map(toRawCampaign)
  }

  // goals
  getGoalByUserSlug(slug: string): number {
    const row = this.sql
      .exec('SELECT goal FROM campaign WHERE user_slug = ? LIMIT 1', slug)
      .toArray()[0] as { goal: number } | undefined
    return row?.goal ?? 0
  }

  getPreviousGoalByUserSlug(slug: string): number {
    const row = this.sql
      .exec(
        'SELECT previous_goal FROM campaign WHERE user_slug = ? LIMIT 1',
        slug,
      )
      .toArray()[0] as { previous_goal: number } | undefined
    return row?.previous_goal ?? 0
  }

  // causes
  getCauses(): JJCause[] {
    return this.allCauseRows().map(toRawCause)
  }

  getCause(causeId: string): JJCause | undefined {
    const row = this.sql
      .exec('SELECT * FROM cause WHERE id = ? LIMIT 1', causeId)
      .toArray()[0] as unknown as CauseRow | undefined
    return row ? toRawCause(row) : undefined
  }

  // event meta
  getRaised(): number {
    return Number(this.getMeta('raised') ?? 0)
  }

  getCollections(): JJCollections {
    const v = this.getMeta('collections')
    if (!v) return { redeemed: 0, total: 0 }
    try {
      return JSON.parse(v) as JJCollections
    } catch {
      return { redeemed: 0, total: 0 }
    }
  }

  getDonations(): number {
    return Number(this.getMeta('donations') ?? 0)
  }

  getDate(): string {
    return this.getMeta('date') ?? new Date().toISOString()
  }

  // currency
  getDollarConversionRate(): number {
    return this.rates().usd
  }

  getGbpToEurRate(): number {
    return this.rates().eur
  }

  // --- TV / display projections (memoized) ---
  getCausesTV(): JJCauseTVType[] {
    return this.memo('causesTV', () => {
      const { usd, eur } = this.rates()
      return this.allCauseRows().map((r) => toCauseTV(r, usd, eur))
    })
  }

  getTVCause(causeId: string): JJCauseTVType | undefined {
    return this.getCausesTV().find((c) => c.id === causeId)
  }

  getCausesDisplay(): CausesDisplayTVType {
    const causes = this.getCausesTV()
    return { count: causes.length, causes }
  }

  private campaignsTVAll(): JJCampaignTVType[] {
    return this.memo('campaignsTVAll', () => {
      const { usd, eur } = this.rates()
      return this.allCampaignRows().map((r) => toCampaignTV(r, usd, eur))
    })
  }

  getCampaignsDisplayAll(): JJCampaignsTVType {
    const campaigns = this.campaignsTVAll()
    return { count: campaigns.length, campaigns, date: this.builtAt() }
  }

  getCampaignsDisplay(): JJCampaignsTVType {
    const all = this.campaignsTVAll()
    const top = all.slice(0, TOP_LIMIT)
    return { count: top.length, campaigns: top, date: this.builtAt() }
  }

  getCampaignDisplay(channelId: string): JJCampaignTVType | undefined {
    const row = this.campaignRowBy('twitch_id', channelId)
    if (!row || row.twitch_id === '') return undefined
    const { usd, eur } = this.rates()
    return toCampaignTV(row, usd, eur)
  }

  getAllCampaignDisplay(): JJCampaignTVType[] {
    return this.memo('allCampaignDisplay', () => {
      const { usd, eur } = this.rates()
      return (
        this.sql
          .exec("SELECT * FROM campaign WHERE twitch_id != '' ORDER BY raised DESC")
          .toArray() as unknown as CampaignRow[]
      ).map((r) => toCampaignTV(r, usd, eur))
    })
  }

  // community (memoized; user_tags + schedule_slugs are JSON in meta)
  private userTagsMap(): Map<string, UserWithTags> {
    const v = this.getMeta('user_tags')
    if (!v) return new Map()
    try {
      const arr = JSON.parse(v) as UserWithTags[]
      return new Map(arr.map((u) => [u.tiltifySlug, u]))
    } catch {
      return new Map()
    }
  }

  private scheduleSlugsMap(): Map<string, string> {
    const v = this.getMeta('schedule_slugs')
    if (!v) return new Map()
    try {
      return new Map(JSON.parse(v) as Array<[string, string]>)
    } catch {
      return new Map()
    }
  }

  private communityAll(): JJCampaignType[] {
    return this.memo('communityAll', () => {
      const { usd, eur } = this.rates()
      const tags = this.userTagsMap()
      const sched = this.scheduleSlugsMap()
      return this.allCampaignRows().map((r) =>
        toCommunityCampaign(r, usd, eur, tags, sched),
      )
    })
  }

  getCommunityCampaignsDisplayAll(): { count: number; list: JJCampaignType[] } {
    const list = this.communityAll()
    return { count: list.length, list }
  }

  getCommunityCampaignsDisplay(): { count: number; list: JJCampaignType[] } {
    const top = this.communityAll().slice(0, TOP_LIMIT)
    return { count: top.length, list: top }
  }

  getUserTagsDisplay(): UserWithTags[] {
    const v = this.getMeta('user_tags')
    if (!v) return []
    try {
      return JSON.parse(v) as UserWithTags[]
    } catch {
      return []
    }
  }

  getFullSchedule(): Promise<FullCommunitySchedule | undefined> {
    return this.storage.get<FullCommunitySchedule>(FULL_SCHEDULE_KEY)
  }

  // twitch logins
  getValidTwitchLogins(): string[] {
    return (
      this.sql
        .exec(
          "SELECT DISTINCT twitch_login FROM campaign WHERE twitch_id != '' AND twitch_login != ''",
        )
        .toArray() as unknown as Array<{ twitch_login: string }>
    ).map((r) => r.twitch_login)
  }

  getInvalidTwitchLogins(): string[] {
    const v = this.getMeta('invalid_twitch_logins')
    if (!v) return []
    try {
      return JSON.parse(v) as string[]
    } catch {
      return []
    }
  }

  getLiveLogins(): string[] {
    return (
      this.sql
        .exec(
          "SELECT DISTINCT twitch_login FROM campaign WHERE is_live = 1 AND twitch_login != ''",
        )
        .toArray() as unknown as Array<{ twitch_login: string }>
    ).map((r) => r.twitch_login)
  }

  // Reconstruct a minimal twitch user record from columns (legacy getter; not
  // on the consumer hot path).
  getTwitchChannelByChannelId(channelId: string) {
    const row = this.campaignRowBy('twitch_id', channelId)
    if (!row || row.twitch_id === '') return undefined
    return {
      id: row.twitch_id,
      login: row.twitch_login,
      display_name: row.twitch_name,
      profile_image_url: row.twitch_avatar,
    }
  }

  // Campaign rows exposed for tasks that need the raw social-resolution inputs.
  campaignRowsForTasks(): CampaignRow[] {
    return this.allCampaignRows()
  }

  getYear(): number {
    return Number(this.getMeta('year') ?? new Date().getUTCFullYear())
  }

  // --- lifecycle ---
  clear() {
    this.storage.transactionSync(() => {
      this.sql.exec('DELETE FROM campaign')
      this.sql.exec('DELETE FROM cause')
      this.sql.exec('DELETE FROM meta')
    })
    this.memoCache.clear()
  }
}

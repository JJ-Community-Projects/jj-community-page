import { DurableObject } from 'cloudflare:workers'
import { Store } from './Store.ts'
import { Scheduler } from './Scheduler.ts'

// JingleJamData v2 — a single SQLite-backed Durable Object.
//
// One source of truth in `ctx.storage.sql` (campaign/cause/meta), projections
// computed-not-stored and memoized in memory, a self-bootstrapping corrected
// scheduler, and the same public method surface the v1 facade exposed to
// consumers (so the eventual cutover is a binding/class swap, not a consumer
// rewrite). See JingleJamData-refactor-proposal.md / IMPLEMENTATION.md.
//
// Addressed (until cutover) via `JJ_DATA_V2` + `idFromName('JJ_API_CACHE_V2')`.
export class JingleJamDataV2 extends DurableObject<Env> {
  private store: Store
  private scheduler: Scheduler

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.store = new Store(ctx.storage)
    this.scheduler = new Scheduler(ctx.storage, this.store, env)
    // Self-bootstrap the alarm on cold start (no admin poke needed).
    this.scheduler
      .ensureAlarm()
      .catch((e) => console.error('JingleJamDataV2 ensureAlarm', e))
  }

  // --- Tiltify: causes ---
  getCause(causeId: string) {
    return this.store.getCause(causeId)
  }
  getCauses() {
    return this.store.getCauses()
  }

  // --- Tiltify: campaigns ---
  getCampaign(userRef: string) {
    return this.store.getCampaign(userRef)
  }
  getCampaignBySlug(slug: string) {
    return this.store.getCampaignBySlug(slug)
  }
  getCampaignByUserSlug(slug: string) {
    return this.store.getCampaignByUserSlug(slug)
  }
  getCampaigns() {
    return this.store.getCampaigns()
  }
  getCampaignsForCause(causeId: string) {
    return this.store.getCampaignsForCause(causeId)
  }

  // --- Tiltify: event metadata ---
  getRaised() {
    return this.store.getRaised()
  }
  getCollections() {
    return this.store.getCollections()
  }
  getDonations() {
    return this.store.getDonations()
  }
  getDate() {
    return this.store.getDate()
  }

  // --- Tiltify: goals ---
  getGoalByUserSlug(slug: string) {
    return this.store.getGoalByUserSlug(slug)
  }
  getPreviousGoalByUserSlug(slug: string) {
    return this.store.getPreviousGoalByUserSlug(slug)
  }

  // --- Currency ---
  getDollarConversionRate() {
    return this.store.getDollarConversionRate()
  }
  getGbpToEurRate() {
    return this.store.getGbpToEurRate()
  }

  // --- Twitch ---
  getLiveLogins() {
    return this.store.getLiveLogins()
  }
  getValidTwitchLogins() {
    return this.store.getValidTwitchLogins()
  }
  getInvalidTwitchLogins() {
    return this.store.getInvalidTwitchLogins()
  }
  getTwitchChannelByChannelId(channelId: string) {
    return this.store.getTwitchChannelByChannelId(channelId)
  }

  // --- User tags ---
  getUserTagsDisplay() {
    return this.store.getUserTagsDisplay()
  }

  // --- Schedule ---
  getFullSchedule() {
    return this.store.getFullSchedule()
  }

  // --- Display (TV / community) ---
  getTVCause(causeId: string) {
    return this.store.getTVCause(causeId)
  }
  getCausesTV() {
    return this.store.getCausesTV()
  }
  getCampaignsDisplay() {
    return this.store.getCampaignsDisplay()
  }
  getCampaignsDisplayAll() {
    return this.store.getCampaignsDisplayAll()
  }
  getCausesDisplay() {
    return this.store.getCausesDisplay()
  }
  getCausesDisplayAll() {
    // v1's `causes:display:all` key was never written (latent bug); v2 serves
    // the full causes set, identical to getCausesDisplay.
    return this.store.getCausesDisplay()
  }
  getCommunityCampaignsDisplay() {
    return this.store.getCommunityCampaignsDisplay()
  }
  getCommunityCampaignsDisplayAll() {
    return this.store.getCommunityCampaignsDisplayAll()
  }
  getCampaignDisplay(channelId: string) {
    return this.store.getCampaignDisplay(channelId)
  }
  getAllCampaignDisplay() {
    return this.store.getAllCampaignDisplay()
  }

  // --- Scheduler ---
  alarm(alarmInfo?: AlarmInvocationInfo) {
    return this.scheduler.alarm(alarmInfo)
  }
  setSchedulerPaused(paused: boolean) {
    return this.scheduler.setSchedulerPaused(paused)
  }
  isSchedulerPaused() {
    return this.scheduler.isSchedulerPaused()
  }
  setTaskEnabled(name: string, enabled: boolean) {
    return this.scheduler.setTaskEnabled(name, enabled)
  }
  getTasksStatus() {
    return this.scheduler.getTasksStatus()
  }
  runTask(name: string) {
    return this.scheduler.runTask(name)
  }
  runOverdueNow() {
    return this.scheduler.runOverdueNow()
  }
  getDueInfo(now: number) {
    return this.scheduler.getDueInfo(now)
  }
  ensureAlarm() {
    return this.scheduler.ensureAlarm()
  }
  getNextAlarmStr() {
    return this.scheduler.getNextAlarmStr()
  }

  // --- Storage lifecycle ---
  // Per-concern reset of the DO's own data + scheduler bookkeeping (not a
  // blanket deleteAll). It self-repopulates on the next alarm cycle.
  async clear() {
    this.store.clear()
    const keys = await this.ctx.storage.list({ prefix: 'v2:' })
    if (keys.size > 0) await this.ctx.storage.delete([...keys.keys()])
  }
}

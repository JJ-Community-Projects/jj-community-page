import { DurableObject } from 'cloudflare:workers'
import type { JJCampaign, JJCause } from './types/JJAPIModel.ts'
import type { JJCauseTVType } from '../lib/orpc/public/twitchExtension/contract.ts'
import { CurrencyStore } from './jingleJamData/CurrencyStore.ts'
import { TiltifyStore } from './jingleJamData/TiltifyStore.ts'
import { TwitchTracker } from './jingleJamData/TwitchTracker.ts'
import { UserTagsBuilder } from './jingleJamData/UserTagsBuilder.ts'
import { ScheduleBuilder } from './jingleJamData/ScheduleBuilder.ts'
import { DisplayBuilder } from './jingleJamData/DisplayBuilder.ts'
import { DonationMatchStore } from './jingleJamData/DonationMatchStore.ts'
import { Scheduler } from './jingleJamData/Scheduler.ts'

// Facade Durable Object. Preserves the public method surface that consumers call
// via `env.JingleJamData` + `idFromName('JJ_API_CACHE')`, while the real work
// lives in focused feature modules that share this DO's single storage.
//
// Module boundaries (see ./jingleJamData/*):
//   CurrencyStore   — USD/EUR conversion rates
//   TiltifyStore    — JJ API campaigns/causes/goals/socials + D1 persistence
//   TwitchTracker   — Twitch validation, live polling, per-campaign live flags
//   UserTagsBuilder — user-tags display projection
//   ScheduleBuilder — full community schedule
//   DisplayBuilder  — TV/display projections
//   DonationMatchStore — per-campaign active donation-match state (rolling sweep)
//   Scheduler       — alarm-driven task runner
// TEMPORARY (prod → beta migration, delete with the block below).
// The transport is JSON, so Date fields arrive as ISO strings. The community
// schedule is the one imported value that carries Dates and cannot be rebuilt
// after the event year (ScheduleBuilder filters on the current year), so it is
// revived here instead of being refused.
function reviveScheduleDates(value: unknown) {
  type StreamEntry = { stream?: { start: unknown; end: unknown } }
  const schedule = value as {
    days?: { day: unknown; streams?: StreamEntry[] }[]
    streams?: StreamEntry[]
  }
  const reviveStream = (entry: StreamEntry) => {
    if (!entry?.stream) return
    entry.stream.start = new Date(entry.stream.start as string)
    entry.stream.end = new Date(entry.stream.end as string)
  }
  for (const day of schedule.days ?? []) {
    day.day = new Date(day.day as string)
    for (const entry of day.streams ?? []) reviveStream(entry)
  }
  for (const entry of schedule.streams ?? []) reviveStream(entry)
  return schedule
}

export class JingleJamData extends DurableObject<Env> {
  private currency: CurrencyStore
  private tiltify: TiltifyStore
  private twitch: TwitchTracker
  private userTags: UserTagsBuilder
  private schedule: ScheduleBuilder
  private display: DisplayBuilder
  private donationMatches: DonationMatchStore
  private scheduler: Scheduler

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    const storage = ctx.storage
    this.currency = new CurrencyStore(storage)
    this.tiltify = new TiltifyStore(storage, env, this.currency)
    this.twitch = new TwitchTracker(storage, env, this.tiltify)
    this.userTags = new UserTagsBuilder(storage, env)
    this.schedule = new ScheduleBuilder(storage, env)
    this.donationMatches = new DonationMatchStore(storage, this.tiltify, env)
    this.display = new DisplayBuilder(
      storage,
      env,
      this.tiltify,
      this.twitch,
      this.currency,
      this.userTags,
      this.donationMatches,
    )
    this.scheduler = new Scheduler(storage, {
      tiltify: this.tiltify,
      twitch: this.twitch,
      currency: this.currency,
      userTags: this.userTags,
      display: this.display,
      schedule: this.schedule,
      donationMatches: this.donationMatches,
    })
  }

  // --- Tiltify: causes ---
  setCauses(causes: JJCause[]) {
    return this.tiltify.setCauses(causes)
  }
  getCause(causeId: string) {
    return this.tiltify.getCause(causeId)
  }
  getCauses() {
    return this.tiltify.getCauses()
  }

  // --- Tiltify: campaigns ---
  setCampaign(campaign: JJCampaign) {
    return this.tiltify.setCampaign(campaign)
  }
  setCampaigns(campaigns: JJCampaign[]) {
    return this.tiltify.setCampaigns(campaigns)
  }
  getCampaign(userRef: string) {
    return this.tiltify.getCampaign(userRef)
  }
  getCampaignBySlug(slug: string) {
    return this.tiltify.getCampaignBySlug(slug)
  }
  getCampaignByUserSlug(slug: string) {
    return this.tiltify.getCampaignByUserSlug(slug)
  }
  getCampaigns() {
    return this.tiltify.getCampaigns()
  }
  getCampaignsForCause(causeId: string) {
    return this.tiltify.getCampaignsForCause(causeId)
  }
  refreshDonationMatches() {
    return this.donationMatches.refreshActiveMatches()
  }
  fetchCampaigns(limit: number, offset: number) {
    return this.tiltify.fetchCampaigns(limit, offset)
  }
  refreshAllCampaigns() {
    return this.tiltify.refreshAllCampaigns()
  }
  refresh() {
    return this.tiltify.refresh()
  }
  insertIntoDB() {
    return this.tiltify.insertIntoDB()
  }

  // --- Tiltify: event metadata ---
  getRaised() {
    return this.tiltify.getRaised()
  }
  getCollections() {
    return this.tiltify.getCollections()
  }
  getDonations() {
    return this.tiltify.getDonations()
  }
  getDate() {
    return this.tiltify.getDate()
  }

  // --- Tiltify: goals ---
  getGoalByUserSlug(slug: string) {
    return this.tiltify.getGoalByUserSlug(slug)
  }
  getPreviousGoalByUserSlug(slug: string) {
    return this.tiltify.getPreviousGoalByUserSlug(slug)
  }

  // --- Tiltify: socials / users ---
  loadAllTiltifySocials() {
    return this.tiltify.loadAllTiltifySocials()
  }
  getTiltifyUsersMap() {
    return this.tiltify.getTiltifyUsersMap()
  }
  getAllTwitchLogins() {
    return this.tiltify.getAllTwitchLogins()
  }
  getAllYoutubeLogins() {
    return this.tiltify.getAllYoutubeLogins()
  }
  updateTiltifyProfiles() {
    return this.tiltify.updateTiltifyProfiles()
  }

  // --- Currency ---
  getDollarConversionRate() {
    return this.currency.getDollarConversionRate()
  }
  getGbpToEurRate() {
    return this.currency.getGbpToEurRate()
  }
  fetchGBPToEURConversionRate() {
    return this.currency.fetchGBPToEURConversionRate()
  }

  // --- Twitch ---
  setStringArray(name: string, values: string[]) {
    return this.twitch.setStringArray(name, values)
  }
  getStringArray(name: string) {
    return this.twitch.getStringArray(name)
  }
  getLiveLogins() {
    return this.twitch.getLiveLogins()
  }
  validateTwitchChannels() {
    return this.twitch.validateTwitchChannels()
  }
  checkLiveStreams() {
    return this.twitch.checkLiveStreams()
  }
  getTwitchChannelByChannelId(channelId: string) {
    return this.twitch.getTwitchChannelByChannelId(channelId)
  }
  getValidTwitchLogins() {
    return this.twitch.getValidTwitchLogins()
  }
  getInvalidTwitchLogins() {
    return this.twitch.getInvalidTwitchLogins()
  }
  clearInvalidTwitchLogins() {
    return this.twitch.clearInvalidTwitchLogins()
  }

  // --- User tags ---
  buildAndStoreUserTags() {
    return this.userTags.buildAndStoreUserTags()
  }
  getUserTagsDisplay() {
    return this.userTags.getUserTagsDisplay()
  }

  // --- Schedule ---
  getFullSchedule() {
    return this.schedule.getFullSchedule()
  }

  // --- Display ---
  buildDisplayData() {
    return this.display.buildDisplayData()
  }
  setTVCause(cause: JJCauseTVType) {
    return this.display.setTVCause(cause)
  }
  getTVCause(causeId: string) {
    return this.display.getTVCause(causeId)
  }
  getCausesTV() {
    return this.display.getCausesTV()
  }
  getCampaignsDisplay() {
    return this.display.getCampaignsDisplay()
  }
  getCampaignsDisplayAll() {
    return this.display.getCampaignsDisplayAll()
  }
  getCausesDisplay() {
    return this.display.getCausesDisplay()
  }
  getCausesDisplayAll() {
    return this.display.getCausesDisplayAll()
  }
  getCommunityCampaignsDisplay() {
    return this.display.getCommunityCampaignsDisplay()
  }
  getCommunityCampaignsDisplayAll() {
    return this.display.getCommunityCampaignsDisplayAll()
  }
  getCampaignDisplay(channelId: string) {
    return this.display.getCampaignDisplay(channelId)
  }
  getAllCampaignDisplay() {
    return this.display.getAllCampaignDisplay()
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

  // --- Temporary: prod → beta storage migration --------------------------
  // Delete this block once the beta copy is done.
  //
  // Values travel as JSON and land in storage unmodified, so Date-bearing
  // projections (`campaigns:display*`, `community:campaigns:display*`,
  // `campaign:display:*`) are NOT imported — they are rebuilt locally by
  // `buildDisplayData()`, and `loadStorage` refuses them so a mistake fails
  // loudly instead of storing ISO strings where consumers expect Dates.
  // `full-community-schedule` is the exception: it cannot be rebuilt for a past
  // event year, so it is imported with its Dates revived (`reviveScheduleDates`).
  async dumpStorage(startAfter: string | undefined, limit: number) {
    const page = await this.ctx.storage.list({ startAfter, limit })
    const entries: [string, unknown][] = []
    for (const [key, value] of page) entries.push([key, value])
    const last = entries.length > 0 ? entries[entries.length - 1][0] : null
    return { entries, cursor: entries.length === limit ? last : null }
  }

  async loadStorage(entries: [string, unknown][]) {
    const dateBearing = entries
      .map(([key]) => key)
      .filter(
        (key) =>
          key !== 'full-community-schedule' &&
          (key.startsWith('campaigns:display') ||
            key.startsWith('community:campaigns:display') ||
            key.startsWith('campaign:display:')),
      )
    if (dateBearing.length > 0) {
      throw new Error(
        `loadStorage refusing date-bearing keys (rebuild locally instead): ${dateBearing
          .slice(0, 5)
          .join(', ')}`,
      )
    }

    let written = 0
    for (let i = 0; i < entries.length; i += 100) {
      const batch: Record<string, unknown> = {}
      for (const [key, value] of entries.slice(i, i + 100)) {
        batch[key] = key === 'full-community-schedule' ? reviveScheduleDates(value) : value
      }
      await this.ctx.storage.put(batch)
      written += Object.keys(batch).length
    }
    return written
  }

  // --- Storage lifecycle ---
  clear() {
    return this.ctx.storage.deleteAll()
  }
}

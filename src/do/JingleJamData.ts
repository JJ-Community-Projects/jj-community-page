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

  // --- Storage lifecycle ---
  clear() {
    return this.ctx.storage.deleteAll()
  }
}

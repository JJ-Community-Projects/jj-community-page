import { getDB } from '../../lib/db/db.ts'
import { and, eq } from 'drizzle-orm'
import { schedulesTable } from '../../lib/db/schema/jj-schema.ts'
import { userDisplayView } from '../../lib/db/schema/views-schema.ts'
import type {
  CausesDisplayTVType,
  JJCampaignsTVType,
  JJCampaignTVType,
  JJCauseTVType,
} from '../../lib/orpc/public/twitchExtension/contract.ts'
import type { JJCampaignType } from '../../lib/orpc/private/jjData/contract.ts'
import { toCurrencies } from '../utils/currencyFormat.ts'
import {
  normalizeTwitchLogin,
  tiltifySlugToTwitchLoginMap,
  toTwitchUrl,
  toYouTubeUrl,
} from '../utils/twitchLogins.ts'
import type { TiltifyStore } from './TiltifyStore.ts'
import type { TwitchTracker } from './TwitchTracker.ts'
import type { CurrencyStore } from './CurrencyStore.ts'
import type { UserTagsBuilder, UserWithTags } from './UserTagsBuilder.ts'
import type { DonationMatchStore } from './DonationMatchStore.ts'

// TV/display projections (the hot read path for the Twitch extension and
// overlay). Reads from the Tiltify/Twitch/Currency/UserTags modules plus D1.
//
// Owns storage keys: `campaign:display:*`, `campaigns:display{,:all}`,
// `causes:display{,:all}`, `cause:tv:*`, `community:campaigns:display{,:all}`.
export class DisplayBuilder {
  constructor(
    private storage: DurableObjectStorage,
    private env: Env,
    private tiltify: TiltifyStore,
    private twitch: TwitchTracker,
    private currency: CurrencyStore,
    private userTags: UserTagsBuilder,
    private donationMatches: DonationMatchStore,
  ) {}

  public async buildDisplayData() {
    // Build and store display projections matching JJCampaignsSchema
    await this.buildAndStoreCampaignsDisplay()

    // Build and store display projections for causes
    await this.buildAndStoreCausesDisplay()

    // Build and store display projections for community campaigns
    await this.buildAndStoreCommunityCampaignsDisplay()
  }

  // --- TV causes ---
  public async setTVCause(cause: JJCauseTVType) {
    await this.storage.put(this.causeKeyTV(cause.id), cause)
  }

  public getTVCause(causeId: string) {
    return this.storage.get(this.causeKeyTV(causeId)) as Promise<
      JJCauseTVType | undefined
    >
  }

  public async getCausesTV() {
    const map = (await this.storage.list({ prefix: 'cause:tv:' })) as Map<
      string,
      unknown
    >
    return Array.from(map.values()) as JJCauseTVType[]
  }

  // --- Display getters ---
  public getCampaignsDisplay(): Promise<JJCampaignsTVType | undefined> {
    return this.storage.get<JJCampaignsTVType>('campaigns:display')
  }

  public getCampaignsDisplayAll(): Promise<JJCampaignsTVType | undefined> {
    return this.storage.get<JJCampaignsTVType>('campaigns:display:all')
  }

  public getCausesDisplay(): Promise<CausesDisplayTVType | undefined> {
    return this.storage.get<CausesDisplayTVType>('causes:display')
  }

  public getCausesDisplayAll(): Promise<CausesDisplayTVType | undefined> {
    return this.storage.get<CausesDisplayTVType>('causes:display:all')
  }

  public getCommunityCampaignsDisplay(): Promise<
    { count: number; list: JJCampaignType[] } | undefined
  > {
    return this.storage.get<{ count: number; list: JJCampaignType[] }>(
      'community:campaigns:display',
    )
  }

  public getCommunityCampaignsDisplayAll(): Promise<
    { count: number; list: JJCampaignType[] } | undefined
  > {
    return this.storage.get<{ count: number; list: JJCampaignType[] }>(
      'community:campaigns:display:all',
    )
  }

  async getCampaignDisplay(channelId: string) {
    return this.storage.get<JJCampaignTVType>(
      `campaign:display:twitchId:${channelId}`,
    )
  }

  async getAllCampaignDisplay() {
    const map = await this.storage.list({
      prefix: `campaign:display:twitchId:`,
    })
    return Array.from(map.values()) as JJCampaignTVType[]
  }

  // --- Builders ---
  // Builds and stores display projections matching JJCampaignsSchema
  private async buildAndStoreCampaignsDisplay() {
    try {
      const usdRate = await this.currency.getDollarConversionRate()
      const eurRate = await this.currency.getGbpToEurRate()
      const tiltifyUsers = await this.tiltify.getTiltifyUsersMap()
      const rawCampaigns = await this.tiltify.getCampaigns()
      const matchState = await this.donationMatches.getState()

      // Build display items for ALL campaigns
      const displayEntries: Record<string, JJCampaignTVType> = {}
      const allDisplayList: JJCampaignTVType[] = await Promise.all(
        rawCampaigns.map(async (c) => {
          const userSlug = c.user.slug
          let isLive = false
          try {
            const val = await this.twitch.getCampaignLive(userSlug)
            isLive = !!val
          } catch (e) {
            console.error(
              'buildAndStoreCampaignsDisplay',
              'error getting live flag',
              userSlug,
              e,
            )
          }

          const user = tiltifyUsers.get(userSlug)
          let twitch: JJCampaignTVType['twitch'] | undefined = undefined
          const twitchSocial =
            tiltifySlugToTwitchLoginMap.get(userSlug) ?? user?.social.twitch
          let login = twitchSocial ? normalizeTwitchLogin(twitchSocial) : ''
          let twitchId = ''
          if (login) {
            let twitchAvatar: string | undefined
            const tuser = await this.twitch.getTwitchUserByLogin(login)
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

          const matchStarts = matchState[c.id]?.activeStarts ?? null
          const display: JJCampaignTVType = {
            tiltifySlug: c.user.slug,
            campaignName: c.name,
            tiltifyUrl: c.url,
            tiltifyName: c.user.name,
            tiltifyDescription: c.description,
            tiltifyCauseId: c.causeId ? c.causeId : undefined,
            avatar: c.user.avatar ?? '',
            raised: toCurrencies(c.raised, usdRate, eurRate),
            goal: toCurrencies(c.goal, usdRate, eurRate),
            twitch,
            hasActiveDonationMatch: matchStarts !== null,
            donationMatchStartsAt:
              matchStarts === null ? null : new Date(matchStarts),
          }
          displayEntries[`campaign:display:${userSlug}`] = display
          if (twitchId !== '') {
            displayEntries[`campaign:display:twitchId:${twitchId}`] = display
          }
          return display
        }),
      )

      // Batch write all campaign display entries
      await this.storage.put(displayEntries)

      // Create TOP 100 slice by raised GBP descending
      const top100 = [...allDisplayList]
        .sort((a, b) => b.raised.gbp - a.raised.gbp)
        .slice(0, 100)

      const campaignsDisplayTop: JJCampaignsTVType = {
        count: top100.length,
        campaigns: top100,
        date: new Date(),
      }
      const campaignsDisplayAll: JJCampaignsTVType = {
        count: allDisplayList.length,
        campaigns: allDisplayList,
        date: new Date(),
      }

      // Batch write summary display entries
      await this.storage.put({
        'campaigns:display': campaignsDisplayTop,
        'campaigns:display:all': campaignsDisplayAll,
      })
    } catch (e) {
      console.error('build display campaigns', e)
    }
  }

  // Build and store display projections for causes matching causesContract output
  private async buildAndStoreCausesDisplay() {
    try {
      const usdRate = await this.currency.getDollarConversionRate()
      const eurRate = await this.currency.getGbpToEurRate()

      const rawCauses = await this.tiltify.getCauses()

      const causes: JJCauseTVType[] = await Promise.all(
        rawCauses.map(async (c) => {
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

      const output: CausesDisplayTVType = {
        count: causes.length,
        causes,
      }

      await this.storage.put('causes:display', output)
    } catch (e) {
      console.error('build display causes', e)
    }
  }

  private async buildAndStoreCommunityCampaignsDisplay() {
    const rawCampaigns = await this.tiltify.getCampaigns()
    try {
      const usdRate = await this.currency.getDollarConversionRate()
      const eurRate = await this.currency.getGbpToEurRate()

      const slugs = Array.from(
        new Set(
          rawCampaigns
            .map((c) => c.user?.slug)
            .filter((s): s is string => Boolean(s)),
        ),
      )

      let scheduleByTiltify = new Map<string, string>()
      const year = new Date().getFullYear()
      if (slugs.length > 0) {
        try {
          const db = getDB(this.env)
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

      const userTags = await this.userTags.getUserTagsDisplay()
      let userTagsMap = new Map<string, UserWithTags>()
      if (userTags) {
        userTagsMap = new Map<string, UserWithTags>(
          userTags.map((u) => [u.tiltifySlug, u]),
        )
      }

      const tiltifyUsers = await this.tiltify.getTiltifyUsersMap()
      const matchState = await this.donationMatches.getState()

      const listAll = await Promise.all(
        rawCampaigns.map(async (c) => {
          const userSlug = c.user.slug
          const user = tiltifyUsers.get(userSlug)
          const userTwitch =
            tiltifySlugToTwitchLoginMap.get(userSlug) ?? user?.social.twitch
          const userYoutube = user?.social.youtube
          const login = userTwitch ? normalizeTwitchLogin(userTwitch) : undefined

          let tuser = undefined

          if (login) {
            tuser = await this.twitch.getTwitchUserByLogin(login)
          }

          const twitchAvatar = (tuser as any)?.profile_image_url
          const twitch = userTwitch ? toTwitchUrl(userTwitch) : undefined

          const youtube = userYoutube ? toYouTubeUrl(userYoutube) : undefined

          const val = await this.twitch.getCampaignLive(c.user.slug)
          const sSlug = userSlug ? scheduleByTiltify.get(userSlug) : undefined

          const matchStarts = matchState[c.id]?.activeStarts ?? null
          const display: JJCampaignType = {
            campaignName: c.name,
            tiltifyUrl: c.url,
            tiltifySlug: c.user.slug,
            tiltifyName: c.user.name,
            tiltifyDescription: c.description || undefined,
            tiltifyCauseId: c.causeId,
            avatar: twitchAvatar ?? c.user.avatar ?? '',
            raised: toCurrencies(c.raised, usdRate, eurRate),
            twitch,
            youtube,
            isTwitchLive: val ?? false,
            scheduleUrl: sSlug ? `/schedules/${sSlug}` : undefined,
            tags: userTagsMap.get(c.user.slug)?.tags ?? [],
            hasActiveDonationMatch: matchStarts !== null,
            donationMatchStartsAt:
              matchStarts === null ? null : new Date(matchStarts),
          }

          return display
        }),
      )

      // Create TOP 100 slice by raised GBP descending
      const listTop = [...listAll]
        .sort((a, b) => b.raised.gbp - a.raised.gbp)
        .slice(0, 100)

      // Batch write both community campaign display entries
      await this.storage.put({
        'community:campaigns:display': {
          count: listTop.length,
          list: listTop,
        },
        'community:campaigns:display:all': {
          count: listAll.length,
          list: listAll,
        },
      })
    } catch (e) {
      console.error('build display community campaigns', e)
    }
  }

  private causeKeyTV(causeId: string) {
    return `cause:tv:${causeId}`
  }
}

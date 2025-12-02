import { implement, ORPCError, os as server } from '@orpc/server'
import {
  contracts,
  type ExtensionConfigTVType,
  type JJCampaignsTVType,
} from './contract.ts'
import { getEntry } from 'astro:content'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'
import { getStreamColors } from '../../../../functions/jjDatesToColors.ts'
import { DateTime } from 'luxon'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import { rangeFromData } from '../../../utils/rangeFromData.ts'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { and, eq, gte, inArray, or } from 'drizzle-orm'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
  teamMembersTable,
} from '../../../db/schema/jj-schema.ts'
import { userDisplayView } from '../../../db/schema/views-schema.ts'
import { friendsTable } from '../../../db/schema/auth-schema.ts'
import {
  getHardCodedEventsNoYogsForExtension,
  getUserIdByTwitchChannelId,
  loadCause,
  loadChannelOverview,
  loadUserData,
  loadUserExtensionConfig,
  loadUserRelatedSchedule,
  loadUserRelations,
  loadUserSchedule,
  loadYogsSchedule,
  storeCause, storeChannelOverview,
  storeUserData,
  storeUserExtensionConfig,
  storeUserRelatedSchedule,
  storeUserRelations,
  storeUserSchedule,
  storeYogsSchedule,
  type UserExtensionTab,
  valueToCurrencies,
} from './util.ts'

const yogsMembers = [
  '20786541',
  '26538483',
  '21945983',
  '19309473',
  '22168131',
  '38051463',
  '12131870',
  '21615575',
  '26574506',
  '43903804',
  '91990032',
  '87245015',
  '145983935',
  '46969360',
  '96502692',
  '21285936',
  '38167015',
  '43903922',
  '113954840',
  '42314834',
  '37569443',
  '24070690',
  '219068259',
  '62568743',
  '52172280',
  '62904151',
  '31883069',
  '40639871',
  '141902679',
  '416016021',
  '44135610',
  '27063689',
  '38180017',
  '79911474',
  '64758947',
  '239617169',
  '150004439',
  '21069037',
  '465613748',
  '91904368',
  '48950229',
  '68525019',
  '172932486',
  '57595823',
  '32155062',
  '1012950837',
]
const yogsId = '20786541'
const ostofbot = '960814823'
const ostof = '96860795'

interface ORPCContext extends ResponseHeadersPluginContext {
  locals?: App.Locals
  request?: Request
  env?: Env
}

const rateLimit = server.$context<ORPCContext>().middleware(
  async (
    { context, next },
    input: {
      channelId: string
      userId: string
    },
  ) => {
    const key = `TwitchExtensionRateLimiter:${input.channelId}:${input.userId}`
    const TwitchExtensionRateLimiter = context.env!.TwitchExtensionRateLimiter
    const doId = TwitchExtensionRateLimiter.idFromName(key)
    const stub = TwitchExtensionRateLimiter.get(doId)
    const result = await stub.attempt()
    context.resHeaders?.set(
      'X-RateLimit-Remaining',
      result.remainingTokens.toString(),
    )
    if (!result.allowed) {
      context.resHeaders?.set(
        'Retry-After',
        (result.retryAfterMs / 1000).toFixed(3),
      )
      throw new ORPCError('TOO_MANY_REQUESTS')
    }
    return next()
  },
)

const originCheck = server.$context<ORPCContext>().middleware(
  async (
    { context, next },
    input: {
      channelId: string
      userId: string
    },
  ) => {
    const origin = context.resHeaders?.get('origin')
    if (!origin) {
      return next()
    }

    if (origin.includes('ext-twitch.tv')) {
      return next()
    }
    if (origin.includes('http://localhost')) {
      return next()
    }

    return next()
  },
)

const os = implement(contracts).use(hasAstroContext)

const extensionConfig = os.extensionConfigContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 120,
      sMaxAge: 120,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context, input }) => {
    const cachedConfig = await context.env.KV.get('twitch-extension:config')

    if (cachedConfig !== null) {
      return JSON.parse(cachedConfig)
    }

    const ConfigDO = context.env.ConfigDO
    const stubId = ConfigDO.idFromName('ConfigDO')
    const stub = ConfigDO.get(stubId)

    // Base configs
    const year = await stub.getNumberConfig('twitch-extension:config.year')

    // Visibility toggles
    const showYogsSchedule = await stub.getBooleanConfig(
      'twitch-extension:config.showYogsSchedule',
    )
    const showCharities = await stub.getBooleanConfig(
      'twitch-extension:config.showCharities',
    )
    const showFundraisers = await stub.getBooleanConfig(
      'twitch-extension:config.showFundraisers',
    )
    const showUserFundraiser = await stub.getBooleanConfig(
      'twitch-extension:config.showUserFundraiser',
    )
    const showUserSchedule = await stub.getBooleanConfig(
      'twitch-extension:config.showUserSchedule',
    )

    // Refresh intervals
    const refreshIntervalYogsSchedule = await stub.getNumberConfig(
      'twitch-extension:config.refreshInterval.yogsSchedule',
    )
    const refreshIntervalCharities = await stub.getNumberConfig(
      'twitch-extension:config.refreshInterval.charities',
    )
    const refreshIntervalFundraisers = await stub.getNumberConfig(
      'twitch-extension:config.refreshInterval.fundraisers',
    )

    // Donation link and tracker
    const donationLinkUrl = await stub.getStringConfig?.(
      'twitch-extension:config.donationLink.url',
    )
    const donationLinkVisible = await stub.getBooleanConfig(
      'twitch-extension:config.donationLink.visible',
    )
    const donationLinkText = await stub.getStringConfig?.(
      'twitch-extension:config.donationLink.text',
    )
    const donationTrackerUrl = await stub.getStringConfig?.(
      'twitch-extension:config.donationTrackerUrl',
    )

    const config: ExtensionConfigTVType = {
      year: year ?? 2024,
      showYogsSchedule: showYogsSchedule ?? false,
      showCharities: showCharities ?? false,
      showFundraisers: showFundraisers ?? false,
      showUserFundraiser: showUserFundraiser ?? false,
      showUserSchedule: showUserSchedule ?? false,
      refreshInterval: {
        yogsSchedule: refreshIntervalYogsSchedule ?? 1000 * 60 * 10,
        charities: refreshIntervalCharities ?? 1000 * 60,
        fundraisers: refreshIntervalFundraisers ?? 1000 * 60,
      },
      donationLink: {
        url: donationLinkUrl ?? '',
        visible: donationLinkVisible ?? false,
        text: donationLinkText ?? 'Donate',
      },
      donationTrackerUrl: donationTrackerUrl ?? '',
      timestamp: DateTime.now().toUTC().toISO(),
    }

    await context.env.KV.put(
      'twitch-extension:config',
      JSON.stringify(config),
      {
        expirationTtl: 300,
      },
    )

    return config
  })

const userExtensionConfig = os.userExtensionConfigContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 180,
    }),
  )
  .use(dbMiddleware)
  .handler(async ({ context, input }) => {
    // Try KV cache first
    const cached = await loadUserExtensionConfig(
      context.env.KV,
      input.channelId,
    )
    if (cached) {
      return cached
    }


    if (input.channelId === ostofbot) {
      return {
        hasCampaign: true,
        hasSchedule: true,
        tabs: ['user-schedule', 'charities', 'fundraisers', 'yogs'],
      }
    }

    const isYogs = input.channelId === yogsId || input.channelId === ostof

    if (isYogs) {
      return {
        hasCampaign: false,
        hasSchedule: false,
        tabs: ['yogs', 'charities', 'fundraisers'],
      }
    }


    const db = context.db

    // Determine the current campaign year from ConfigDO
    const ConfigDO = context.env!.ConfigDO
    const stub = ConfigDO.get(ConfigDO.idFromName('ConfigDO'))
    const year =
      (await stub.getNumberConfig('twitch-extension:config.year')) ??
      new Date().getUTCFullYear()

    console.log('user-config', 'year', year)

    const JJDO = context.env.JingleJamData
    const jjStub = JJDO.get(JJDO.idFromName('JJ_API_CACHE'))
    const campaignByTwitchId = await jjStub.getCampaignDisplay(input.channelId)
    const userId = await getUserIdByTwitchChannelId(db, input.channelId)

    // const x = await jjStub.getAllCampaignDisplay()
    // Check if JJ campaign exists for user/year

    console.log('user-config', 'userId', userId)

    let hasSchedule = false
    if (userId) {
      // Check if a primary & visible schedule exists for user/year
      const schedule = await db
        .select({ id: schedulesTable.id })
        .from(schedulesTable)
        .where(
          and(
            eq(schedulesTable.ownerId, userId),
            eq(schedulesTable.year, year),
            eq(schedulesTable.primary, true),
            eq(schedulesTable.visible, true),
          ),
        )
        .get()
      console.log('user-config', 'scheduleId', schedule?.id)
      hasSchedule = !!schedule
    }

    const hasCampaign = !!campaignByTwitchId

    let tabs: UserExtensionTab[] = []

    if (yogsMembers.includes(input.channelId)) {
      if (hasSchedule) {
        console.log('user-config', 'yogs-member', 'schedule')
        tabs = ['user-schedule', 'charities', 'fundraisers', 'yogs']
      } else {
        console.log('user-config', 'yogs-member', 'no-schedule')
        tabs = ['charities', 'fundraisers', 'yogs']
      }
    } else if (!hasSchedule && !hasCampaign) {
      console.log('user-config', 'no-schedule', 'no-campaign')
      tabs = ['charities', 'fundraisers']
    } else if (hasSchedule && hasCampaign) {
      console.log('user-config', 'schedule', 'campaign')
      tabs = ['user-schedule', 'charities', 'fundraisers']
    } else if (!hasSchedule && hasCampaign) {
      console.log('user-config', 'no-schedule', 'campaign')
      tabs = ['charities', 'fundraisers']
    } else if (hasSchedule && !hasCampaign) {
      console.log('user-config', 'schedule', 'no-campaign')
      tabs = ['user-schedule', 'charities', 'fundraisers']
    } else {
      console.log('user-config', 'unexpected')
      tabs = ['charities', 'fundraisers']
    }

    console.log('user-config', 'tabs', tabs)

    const result = {
      hasCampaign,
      hasSchedule,
      tabs,
    }

    await storeUserExtensionConfig(context.env.KV, input.channelId, result, 300)

    return result
  })

// List all campaigns from DO cache
const campaigns = os.campaignsContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    try {
      const campaignsDisplay: JJCampaignsTVType | undefined =
        await stub.getCampaignsDisplayAll()
      const liveLogins = await stub.getLiveLogins()
      const liveSet = new Set(
        (liveLogins ?? []).map((l: string) => l.toLowerCase()),
      )

      if (!campaignsDisplay || !Array.isArray(campaignsDisplay.campaigns)) {
        const dateStr = await stub.getDate()
        return { count: 0, campaigns: [], date: new Date(dateStr) }
      }

      // Merge latest live state into precomputed list
      const mergedList = campaignsDisplay.campaigns.map((item) => {
        if (item?.twitch?.name) {
          const name = String(item.twitch.name).toLowerCase()
          return {
            ...item,
            twitch: {
              ...item.twitch,
              isLive: liveSet.has(name),
            },
          }
        }
        return item
      })

      // Sort the merged list in the following order:
      // 1) campaigns with twitch channel that are live
      // 2) campaigns with twitch channel that are not live
      // 3) all other campaigns
      // Additionally, sort by raised.gbp (descending) within each group
      const getGroupRank = (it: any) => {
        if (it?.twitch?.name) {
          return it?.twitch?.isLive ? 0 : 1
        }
        return 2
      }
      const getRaisedGbp = (it: any) => {
        const val = it?.raised?.gbp
        return typeof val === 'number' ? val : 0
      }
      const sortedList = mergedList
        .toSorted((a: any, b: any) => {
          const ga = getGroupRank(a)
          const gb = getGroupRank(b)
          if (ga !== gb) return ga - gb
          const ra = getRaisedGbp(a)
          const rb = getRaisedGbp(b)
          if (ra !== rb) return rb - ra // higher raised first
          return 0
        })
        .slice(0, 100)

      return {
        count: campaignsDisplay.count ?? sortedList.length,
        campaigns: sortedList,
        date: new Date(campaignsDisplay.date ?? new Date().toISOString()),
      }
    } catch (e) {
      throw e
    }
  })

// List all causes from DO cache
const causes = os.causesContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context, input }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    const campaign = await stub.getCampaignDisplay(input.channelId)

    // Prefer precomputed causes display from DO
    const causesDisplay = await stub.getCausesDisplay()
    if (causesDisplay) {
      if (!campaign) {
        return causesDisplay
      }

      const causeId = campaign.tiltifyCauseId
      console.log('causeId', causeId)
      if (!causeId) {
        return causesDisplay
      }

      const cause = causesDisplay.causes.find((c) => c.id === causeId)
      if (cause) {
        console.log('cause', cause)
        const otherCauses = causesDisplay.causes.filter((c) => c.id !== causeId)
        return {
          count: causesDisplay.count,
          causes: [cause, ...otherCauses],
        }
      }
      console.log('causesDisplay', causesDisplay)
      return causesDisplay
    }

    // Fallback: compute from raw data if precomputed display is unavailable
    const causes = await stub.getCausesTV()
    const usdRate = await stub.getDollarConversionRate()
    const eurRate = await stub.getGbpToEurRate()
    if (!causes) {
      return {
        count: 0,
        causes: [],
      }
    }

    if (campaign) {
      const causeId = campaign.tiltifyCauseId

      if (causeId) {
        const cause = causes.find((c) => c.id === causeId)
        if (cause) {
          const otherCauses = causes.filter((c) => c.id !== causeId)
          return {
            count: causes.length,
            causes: [cause, ...otherCauses],
          }
        }
      }
    }

    return {
      count: causes.length,
      causes: causes,
    }
  })

const overview = os.overviewContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context, input }) => {
    const channelId = input.channelId
    // Try KV cache first
    const cached = await loadChannelOverview(context.env.KV, channelId)
    if (cached) {
      return cached
    }

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    const usdRate = await stub.getDollarConversionRate()
    const eurRate = await stub.getGbpToEurRate()
    const raised = await stub.getRaised()
    const collections = await stub.getCollections()
    const donations = await stub.getDonations()
    const dateStr = await stub.getDate()

    if (yogsMembers.includes(input.channelId)) {
      const overview = {
        raised: {
          total: valueToCurrencies(raised, usdRate, eurRate),
        },
        collections: collections,
        donations: donations,
        date: new Date(dateStr),
      }
      await storeChannelOverview(context.env.KV, overview, channelId,30)
    }

    const yogs = await stub.getCampaignByUserSlug('yogscast')
    const overview = {
      raised: {
        yogscast: yogs
          ? valueToCurrencies(yogs!.raised, usdRate, eurRate)
          : undefined,
        fundraisers: yogs
          ? valueToCurrencies(raised - yogs!.raised, usdRate, eurRate)
          : undefined,
        total: valueToCurrencies(raised, usdRate, eurRate),
      },
      collections: collections,
      donations: donations,
      date: new Date(dateStr),
    }

    await storeChannelOverview(context.env.KV, overview,  channelId,30)

    return overview
  })

const yogsSchedule = os.yogsScheduleContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 180,
    }),
  )
  .handler(async ({ context }) => {
    const yogsSchedule = await loadYogsSchedule(context.env.KV)

    if (yogsSchedule) {
      return yogsSchedule
    }

    // Resolve the current schedule year from the Config Durable Object
    const ConfigDO = context.env.ConfigDO
    const stubId = ConfigDO.idFromName('ConfigDO')
    const stub = ConfigDO.get(stubId)
    const year = await stub.getNumberConfig('twitch-extension:config.year')

    // Load the schedule entry for the given year from Astro content collections
    const schedule = await getEntry('schedules', `${year ?? 2024}`)
    if (!schedule) {
      const now = new Date()
      return {
        title: `Yogscast Jingle Jam ${year ?? 2024}`,
        start: now,
        end: now,
        initialDayIndex: 0,
        days: [],
        streams: [],
      }
    }
    const outStreams: Array<{
      title: string
      subtitle?: string
      description?: string
      markdownDescription?: string
      start: Date
      end: Date
      creators?: Array<{
        id: string
        name: string
        url: string
        imageUrl?: string
        color: string
      }>
      vods?: Array<{ label?: string; link: string }>
      color: string
    }> = []

    const days: Array<{
      start: Date
      end: Date
      streams: typeof outStreams
    }> = []

    const enableHardCoded = false

    const hardcodedStreams = await getHardCodedEventsNoYogsForExtension()
    // Group hardcoded streams by ISO date (YYYY-MM-DD) of their start time for quick lookup
    const hardcodedByDay = new Map<string, typeof hardcodedStreams>()
    for (const hs of hardcodedStreams ?? []) {
      // Use UTC date (YYYY-MM-DD) to avoid timezone mismatches when grouping
      const key = hs.start?.toISOString?.().slice(0, 10)
      if (!key) continue
      const arr = hardcodedByDay.get(key) ?? []
      arr.push(hs)
      hardcodedByDay.set(key, arr)
    }

    // Traverse weeks -> days -> streams, resolving referenced entries via getEntry
    for (const week of schedule.data.weeks ?? []) {
      for (const dayRef of week.days ?? []) {
        const dayEntry = await getEntry(dayRef)
        if (!dayEntry) continue
        const day = dayEntry.data

        const dayStreams = day.streams ?? []
        const dayOutStreams: typeof outStreams = []

        // Prepend hardcoded streams matching this day (must appear at the beginning)
        const dayDateISO = day.date.toISOString().slice(0, 10)

        if (enableHardCoded) {
          const prepend = dayDateISO
            ? (hardcodedByDay.get(dayDateISO) ?? [])
            : []
          // Sort by start time just in case
          prepend.sort((a, b) => a.start.getTime() - b.start.getTime())
          for (const hs of prepend) {
            const mapped = {
              title: hs.title,
              subtitle: hs.subtitle,
              description: hs.description,
              markdownDescription: hs.markdownDescription,
              start: hs.start,
              end: hs.end,
              creators: hs.creators,
              vods: hs.vods,
              color:
                hs.color ||
                getStreamColors(DateTime.fromJSDate(hs.start))['500'],
            }
            dayOutStreams.push(mapped)
            outStreams.push(mapped)
          }
        }
        for (const s of dayStreams) {
          // Resolve creators referenced by the stream (if any)
          let creators:
            | Array<{
                id: string
                name: string
                url: string
                imageUrl?: string
                color: string
              }>
            | undefined
          if (Array.isArray(s.creators) && s.creators.length > 0) {
            const list: Array<{
              id: string
              name: string
              url: string
              imageUrl?: string
              color: string
            }> = []
            for (const cRef of s.creators) {
              const cEntry = await getEntry(cRef)
              if (!cEntry) continue
              const cd = cEntry.data
              const imageUrl: string | undefined =
                cd?.profileImage?.medium ||
                cd?.profileImage?.large ||
                cd?.profileImage?.small
              const links = cd.links?.filter((c) => c.type === 'twitch').at(0)
              const url: string = links?.url ?? '' // cd?.link || (Array.isArray(cd?.links) && cd.links[0]?.url) || ''
              const color: string = cd?.style?.primaryColor || '#000000'
              list.push({
                id: cEntry.id,
                name: cd?.name ?? '',
                url,
                imageUrl,
                color,
              })
            }
            creators = list
          }

          // Map VODs if present
          const vods = Array.isArray(s.vods)
            ? s.vods
                .filter((v) => v.type === 'twitch')
                .map((v) => ({ label: v?.label, link: v?.link }))
            : undefined

          // Choose a representative color for the stream from its background style (fallback to black)
          const colorMap = getStreamColors(DateTime.fromJSDate(s.start))

          const mapped = {
            title: s.title,
            subtitle: s.subtitle,
            description: s.description,
            markdownDescription: s.markdownDescription,
            start: s.start,
            end: s.end,
            creators,
            vods,
            color: colorMap['500'],
          }
          dayOutStreams.push(mapped)
          outStreams.push(mapped)
        }
        const range = rangeFromData(dayOutStreams) || {
          start: dayOutStreams[0]?.start ?? new Date(),
          end: dayOutStreams[dayOutStreams.length - 1]?.end ?? new Date(),
        }
        dayOutStreams.sort((a, b) => a.start.getTime() - b.start.getTime())
        days.push({
          start: range.start,
          end: range.end,
          streams: dayOutStreams,
        })
      }
    }

    const range = rangeFromData(outStreams) || {
      start: new Date(),
      end: new Date(),
    }

    // Determine initialDayIndex: first day that hasn't fully ended yet; fallback to last day or 0
    const now = new Date()
    let initialDayIndex = days.findIndex((d) => now <= d.end)
    if (initialDayIndex === -1) {
      initialDayIndex = Math.max(0, days.length - 1)
    }

    const result = {
      title: `Yogscast Jingle Jam ${year ?? 2024}`,
      start: range.start,
      end: range.end,
      initialDayIndex,
      days,
      streams: outStreams,
    }
    await storeYogsSchedule(context.env.KV, result, 600)
    return result
  })

// Resolve user by Twitch channel, return JJ campaign for current year
const userData = os.userDataContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .use(dbMiddleware)
  .handler(async ({ context, input }) => {
    const ostofbot = '960814823'
    if (input.channelId === ostofbot) {
      return {
        campaign: {
          tiltifySlug: 'test',
          campaignName: 'Test Campaign',
          tiltifyUrl: 'https://jinglejam.tiltify.com',
          tiltifyName: 'ostofbot',
          avatar: 'https://assets.tiltify.com/assets/default-avatar.png',
          raised: {
            gbp: 300,
            gbpFormatted: '420',
            usd: 300,
            usdFormatted: '300',
            euro: 300,
            euroFormatted: '€300',
          },
          goal: {
            gbp: 0,
            gbpFormatted: '0',
            usd: 0,
            usdFormatted: '',
            euro: 0,
            euroFormatted: '€0',
          },
          twitch: {
            name: 'ostofbot',
            avatar:
              'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-70x70.png',
            isLive: false,
            url: 'https://www.twitch.tv/ostofbot',
          },
        },
      }
    }

    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    const userData = await loadUserData(context.env.KV, input.channelId)
    if (userData) {
      if (userData.tiltifyCauseId) {
        const cachedCause = await loadCause(
          context.env.KV,
          userData.tiltifyCauseId,
        )
        if (cachedCause) {
          return {
            campaign: userData,
            cause: cachedCause,
          }
        }
        const cause = await stub.getTVCause(userData.tiltifySlug)
        if (cause) {
          await storeCause(context.env.KV, cause)
        }
        return {
          campaign: userData,
          cause: cause,
        }
      }

      return { campaign: userData }
    }

    // const db = context.db

    /*
    const { camp } = await getCampaignByTwitchChannelId(
      input.channelId,
      context.env,
      db,
    )

    if (!camp) {
      throw new ORPCError('NOT_FOUND', { message: 'JJ campaign not found' })
    }*/

    const campaign = await stub.getCampaignDisplay(input.channelId)

    if (!campaign) {
      throw new ORPCError('NOT_FOUND')
    }

    await storeUserData(context.env.KV, input.channelId, campaign)

    const causeId = campaign.tiltifyCauseId
    if (causeId) {
      const cachedCause = await loadCause(context.env.KV, causeId)
      if (cachedCause) {
        return {
          campaign,
          cause: cachedCause,
        }
      }
      const cause = await stub.getTVCause(causeId)
      if (cause) {
        await storeCause(context.env.KV, cause)
      }
      return {
        campaign,
        cause,
      }
    }

    return { campaign }
  })

// Resolve user's primary schedule and upcoming streams
const userSchedule = os.userScheduleContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .use(dbMiddleware)
  .handler(async ({ context, input }) => {
    const userSchedule = await loadUserSchedule(context.env.KV, input.channelId)
    if (userSchedule) {
      return userSchedule
    }

    const db = context.db

    // find twitch channel
    const userId = await getUserIdByTwitchChannelId(db, input.channelId)

    if (!userId) {
      throw new ORPCError('NOT_FOUND', { message: 'Twitch channel not found' })
    }

    const ConfigDO = context.env!.ConfigDO
    const stub = ConfigDO.get(ConfigDO.idFromName('ConfigDO'))
    const year =
      (await stub.getNumberConfig('twitch-extension:config.year')) ??
      new Date().getUTCFullYear()

    const schedule = await db
      .select({ id: schedulesTable.id, title: schedulesTable.title })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.ownerId, userId),
          eq(schedulesTable.year, year),
          eq(schedulesTable.primary, true),
          eq(schedulesTable.visible, true),
        ),
      )
      .get()

    if (!schedule)
      throw new ORPCError('NOT_FOUND', { message: 'No schedule for user/year' })

    const now = new Date()
    const streams = await db
      .select({
        id: streamsTable.id,
        scheduleId: streamsTable.scheduleId,
        title: streamsTable.title,
        subtitle: streamsTable.subtitle,
        description: streamsTable.description,
        start: streamsTable.start,
        end: streamsTable.end,
      })
      .from(streamsTable)
      .where(
        and(
          eq(streamsTable.scheduleId, schedule.id),
          // gte(streamsTable.end, now),
        ),
      )
      .orderBy(streamsTable.start)
      .all()

    if (streams.length === 0) {
      const now = new Date()
      return { title: schedule.title, start: now, end: now, streams: [] }
    }

    // Load participants per stream and map to creators
    const creatorsByKey = new Map<string, any[]>()
    for (const s of streams) {
      const parts = await db
        .select({
          userId: userDisplayView.userId,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          primaryColor: userDisplayView.primaryColor,
          twitchLogin: userDisplayView.twitchLogin,
        })
        .from(streamParticipantsTable)
        .innerJoin(
          userDisplayView,
          eq(streamParticipantsTable.userId, userDisplayView.userId),
        )
        .where(
          and(
            eq(streamParticipantsTable.scheduleId, s.scheduleId),
            eq(streamParticipantsTable.streamId, s.id),
          ),
        )
        .all()
      creatorsByKey.set(`${s.scheduleId}-${s.id}`, parts)
    }

    const out = streams
      .map((s) => {
        const key = `${s.scheduleId}-${s.id}`
        const creators = (creatorsByKey.get(key) ?? []).map((u) => ({
          id: String(u.userId),
          name: u.username,
          url: u.twitchLogin ? `https://twitch.tv/${u.twitchLogin}` : '',
          imageUrl: u.profileImage ?? undefined,
          color: u.primaryColor ?? '#000000',
        }))
        const colorMap = getStreamColors(DateTime.fromJSDate(s.start as any))
        return {
          title: s.title,
          subtitle: s.subtitle ?? undefined,
          description: s.description ?? undefined,
          start: s.start,
          end: s.end,
          creators,
          color: colorMap['500'],
        }
      })
      .toSorted((a, b) => {
        return a.end.getTime() - b.end.getTime()
      })

    const range = rangeFromData(out) || {
      start: out[0]!.start,
      end: out[out.length - 1]!.end,
    }
    const result = {
      title: schedule.title,
      start: range.start,
      end: range.end,
      streams: out,
    }
    await storeUserSchedule(context.env.KV, input.channelId, result, 600)
    return result
  })

// Find user friends
const userRelations = os.userRelationsContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .use(dbMiddleware)
  .handler(async ({ context, input }) => {
    const relations = await loadUserRelations(context.env.KV, input.channelId)

    if (relations) {
      return relations
    }

    const db = context.db
    // find twitch channel
    const userId = await getUserIdByTwitchChannelId(db, input.channelId)

    if (!userId) {
      throw new ORPCError('NOT_FOUND', { message: 'Twitch channel not found' })
    }

    const rows = await db
      .select({
        fromUserId: friendsTable.fromUserId,
        toUserId: friendsTable.toUserId,
      })
      .from(friendsTable)
      .where(
        or(
          eq(friendsTable.fromUserId, userId),
          eq(friendsTable.toUserId, userId),
        ),
      )
      .all()

    const friendIds = Array.from(
      new Set(
        rows.map((r) => (r.fromUserId === userId ? r.toUserId : r.fromUserId)),
      ),
    )

    if (friendIds.length === 0) return { friends: [] }

    const friends = await db
      .select({
        userId: userDisplayView.userId,
        primaryLiveStream: userDisplayView.primaryLiveStream,
        createdAt: userDisplayView.createdAt,
        username: userDisplayView.username,
        profileImage: userDisplayView.profileImage,
        twitchLogin: userDisplayView.twitchLogin,
        tiltifySlug: userDisplayView.tiltifySlug,
        tiltifyUrl: userDisplayView.tiltifyUrl,
        primaryColor: userDisplayView.primaryColor,
        accentColor: userDisplayView.accentColor,
      })
      .from(userDisplayView)
      .where(inArray(userDisplayView.userId as any, friendIds as any))
      .all()

    // Cast createdAt to Date
    const mapped = friends.map((f) => ({ ...f, createdAt: f.createdAt as any }))
    const result = { friends: mapped }

    await storeUserRelations(context.env.KV, input.channelId, result, 600)

    return result
  })

// Related schedule via teams: next 3 streams across user's teams
const userRelatedSchedule = os.userRelatedScheduleContract
  .use(rateLimit)
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .use(dbMiddleware)
  .handler(async ({ context, input }) => {
    const related = await loadUserRelatedSchedule(
      context.env.KV,
      input.channelId,
    )

    if (related) {
      return related
    }

    const db = context.db
    // find twitch channel
    const userId = await getUserIdByTwitchChannelId(db, input.channelId)

    if (!userId) {
      throw new ORPCError('NOT_FOUND', { message: 'Twitch channel not found' })
    }

    // find all teams the user is part of
    const myTeams = await db
      .select({ teamId: teamMembersTable.teamId })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.userId, userId))
      .all()

    if (myTeams.length === 0) return { teams: { streams: [] } }

    const teamIds = myTeams.map((t) => t.teamId)

    // get all users who are members of these teams (including self)
    const members = await db
      .select({ userId: teamMembersTable.userId })
      .from(teamMembersTable)
      .where(inArray(teamMembersTable.teamId, teamIds))
      .all()

    const userIds = Array.from(new Set(members.map((m) => m.userId)))

    const ConfigDO = context.env!.ConfigDO
    const stub = ConfigDO.get(ConfigDO.idFromName('ConfigDO'))
    const year =
      (await stub.getNumberConfig('twitch-extension:config.year')) ??
      new Date().getUTCFullYear()

    const now = new Date()
    const upcoming = await db
      .select({
        id: streamsTable.id,
        scheduleId: streamsTable.scheduleId,
        title: streamsTable.title,
        subtitle: streamsTable.subtitle,
        description: streamsTable.description,
        start: streamsTable.start,
        end: streamsTable.end,
      })
      .from(streamsTable)
      .innerJoin(schedulesTable, eq(streamsTable.scheduleId, schedulesTable.id))
      .where(
        and(
          inArray(schedulesTable.ownerId, userIds),
          eq(schedulesTable.year, year),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
          gte(streamsTable.start, now),
        ),
      )
      .orderBy(streamsTable.start)
      .all()

    const limited = upcoming.slice(0, 3)

    const creatorsByKey = new Map<string, any[]>()
    for (const s of limited) {
      const parts = await db
        .select({
          userId: userDisplayView.userId,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          primaryColor: userDisplayView.primaryColor,
          twitchLogin: userDisplayView.twitchLogin,
        })
        .from(streamParticipantsTable)
        .innerJoin(
          userDisplayView,
          eq(streamParticipantsTable.userId, userDisplayView.userId),
        )
        .where(
          and(
            eq(streamParticipantsTable.scheduleId, s.scheduleId),
            eq(streamParticipantsTable.streamId, s.id),
          ),
        )
        .all()
      creatorsByKey.set(`${s.scheduleId}-${s.id}`, parts)
    }

    const mapped = limited.map((s) => {
      const key = `${s.scheduleId}-${s.id}`
      const creators = (creatorsByKey.get(key) ?? []).map((u) => ({
        id: String(u.userId),
        name: u.username,
        url: u.twitchLogin ? `https://twitch.tv/${u.twitchLogin}` : '',
        imageUrl: u.profileImage ?? undefined,
        color: u.primaryColor ?? '#000000',
      }))
      const colorMap = getStreamColors(DateTime.fromJSDate(s.start as any))
      return {
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        description: s.description ?? undefined,
        start: s.start as any,
        end: s.end as any,
        creators,
        color: colorMap['500'],
      }
    })

    const result = { teams: { streams: mapped } }

    await storeUserRelatedSchedule(context.env.KV, input.channelId, result, 600)

    return result
  })

export const twitchExtensionRouter = {
  extensionConfig,
  userExtensionConfig,
  campaigns,
  causes,
  overview,
  yogsSchedule,
  userData,
  userSchedule,
  userRelations,
  userRelatedSchedule,
}

// {"year":2024,"showYogsSchedule":true,"showCharities":true,"showFundraisers":true,"refreshInterval":{"yogsSchedule":600000,"charities":60000,"fundraisers":60000},"donationLink":{"url":"","visible":true,"text":"Donate"},"donationTrackerUrl":"","timestamp":"2025-10-27T11:01:56.994Z"}

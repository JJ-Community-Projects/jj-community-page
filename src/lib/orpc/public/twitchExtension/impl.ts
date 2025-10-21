import { implement, ORPCError, os as server } from '@orpc/server'
import { contracts } from './contract.ts'
import { getEntry } from 'astro:content'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'
import { getStreamColors } from '../../../../functions/jjDatesToColors.ts'
import { DateTime } from 'luxon'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import { rangeFromData } from '../../../utils/rangeFromData.ts'
import type { JJCause } from '../../../../do/types/JJAPIModel.ts'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'

interface ORPCContext extends ResponseHeadersPluginContext {
  locals?: App.Locals
  request?: Request
  env?: Env
}
const rateLimit = server.$context<ORPCContext>().middleware(
  async (
    { context, next },
    input: {
      twitch: {
        channelId: string
        userId: string
      }
    },
  ) => {
    const key = `TwitchExtensionRateLimiter:${input.twitch.channelId}:${input.twitch.userId}`
    const TwitchExtensionRateLimiter = context.env!.TwitchExtensionRateLimiter
    const doId = TwitchExtensionRateLimiter.idFromName(key)
    const stub = TwitchExtensionRateLimiter.get(doId)
    const result = await stub.attempt()
    console.log('ratelimit', result)
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
  .handler(async ({ context }) => {
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

    const config = {
      year: year ?? 2024,
      showYogsSchedule: showYogsSchedule ?? false,
      showCharities: showCharities ?? false,
      showFundraisers: showFundraisers ?? false,
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

    await stub.setStringConfig(
      'twitch-extension:config',
      JSON.stringify(config),
    )

    await context.env.KV.put(
      'twitch-extension:config',
      JSON.stringify(config),
      {
        expirationTtl: 600,
      },
    )

    return config
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
      const list = await stub.getCampaigns()
      console.log('campaigns', list)
      if (!list) {
        return {
          count: 0,
          list: [],
        }
      }

      return {
        list,
        count: list.length,
      }
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
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
  .handler(async ({ context }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    const causes = await stub.getCauses()
    console.log('causes', causes)
    if (!causes) {
      return { count: 0, list: [] }
    }

    return {
      count: causes.length,
      list: causes as JJCause[],
    }
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
    // Resolve the current schedule year from the Config Durable Object
    const ConfigDO = context.env.ConfigDO
    const stubId = ConfigDO.idFromName('ConfigDO')
    const stub = ConfigDO.get(stubId)
    const year = await stub.getNumberConfig('twitch-extension-year')

    // Load the schedule entry for the given year from Astro content collections
    const schedule = await getEntry('schedules', `${year ?? 2024}`)
    if (!schedule) {
      const now = new Date()
      return { start: now, end: now, initialDayIndex: 0, days: [], streams: [] }
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

    // Traverse weeks -> days -> streams, resolving referenced entries via getEntry
    for (const week of schedule.data.weeks ?? []) {
      for (const dayRef of week.days ?? []) {
        const dayEntry = await getEntry(dayRef)
        if (!dayEntry) continue

        const dayStreams = dayEntry.data.streams ?? []
        const dayOutStreams: typeof outStreams = []
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
              const url: string =
                cd?.link || (Array.isArray(cd?.links) && cd.links[0]?.url) || ''
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

    return {
      start: range.start,
      end: range.end,
      initialDayIndex,
      days,
      streams: outStreams,
    }
  })

export const twitchExtensionRouter = {
  extensionConfig,
  campaigns,
  causes,
  yogsSchedule,
}

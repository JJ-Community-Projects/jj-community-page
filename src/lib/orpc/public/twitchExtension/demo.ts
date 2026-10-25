import { os } from '@orpc/server'
import { DateTime } from 'luxon'
import type z from 'zod/v4'
import type {
  CausesDisplayTVType,
  ExtensionConfigTVType,
  JJCampaignsTVType,
  JJCampaignTVType,
  OverviewSchema,
  StreamTVType,
  UserDataType,
  UserExtensionConfigSchema,
  UserScheduleTVType,
} from './contract.ts'
import { getStreamColors } from '../../../../functions/jjDatesToColors.ts'
import { valueToCurrencies, type YogsScheduleOutput } from './util.ts'
import campaignsJson from './demo/2025/campaigns.json'
import causesJson from './demo/2025/causes.json'
import overviewJson from './demo/2025/overview.json'

// Demo channel for the Twitch extension review: every extension procedure answers this channel
// with last year's data (saved from the live API after Jingle Jam 2025) instead of live data,
// with the schedules moved to this year's dates.
export const DEMO_CHANNEL_ID = '96860795'
export const DEMO_YEAR = 2025

/**
 * Answers the demo channel with `value()` and skips everything after it. Put it before `cached`:
 * several procedures share one edge cache / KV entry across channels, so a check further down
 * would either never run or store the demo answer for every channel.
 */
export const demo = <T>(value: () => T | Promise<T>) =>
  os.middleware(async ({ next }, input: { channelId: string }, output) =>
    input.channelId === DEMO_CHANNEL_ID ? output(await value()) : next(),
  )

// Conversion rates of the saved overview, so the demo campaign matches the rest of the data.
const usdRate = overviewJson.raised.total.usd / overviewJson.raised.total.gbp
const eurRate = overviewJson.raised.total.euro / overviewJson.raised.total.gbp

const demoCause = causesJson.causes[0]!

export const demoConfig = (): ExtensionConfigTVType => ({
  year: DEMO_YEAR,
  showYogsSchedule: true,
  showHeadlinerSchedule: true,
  showCharities: true,
  showFundraisers: true,
  showUserFundraiser: true,
  showUserSchedule: true,
  refreshInterval: {
    yogsSchedule: 1000 * 60 * 10,
    charities: 1000 * 60,
    fundraisers: 1000 * 60,
  },
  donationLink: {
    url: 'https://jinglejam.tiltify.com',
    visible: true,
    text: 'Donate',
  },
  donationTrackerUrl: 'https://www.jinglejam.co.uk/tracker',
  timestamp: DateTime.now().toUTC().toISO(),
})

export const demoUserConfig = (): z.infer<
  typeof UserExtensionConfigSchema
> => ({
  hasCampaign: true,
  hasSchedule: true,
  tabs: ['user-schedule', 'charities', 'fundraisers', 'yogs'],
})

export const demoCampaigns = (): JJCampaignsTVType => ({
  count: campaignsJson.count,
  campaigns: campaignsJson.campaigns.map((c) => ({
    ...c,
    hasActiveDonationMatch: false,
    donationMatchStartsAt: null,
  })),
  date: new Date(campaignsJson.date),
})

export const demoCauses = (): CausesDisplayTVType => causesJson

export const demoOverview = (): z.infer<typeof OverviewSchema> => ({
  ...overviewJson,
  date: new Date(overviewJson.date),
})

const demoCampaign: JJCampaignTVType = {
  tiltifySlug: 'jingle-jam-2025-demo',
  campaignName: 'Jingle Jam 2025 Demo Campaign',
  tiltifyUrl: 'https://jinglejam.tiltify.com',
  tiltifyName: 'ostof',
  tiltifyCauseId: demoCause.id,
  avatar: 'https://assets.tiltify.com/assets/default-avatar.png',
  raised: valueToCurrencies(1337.42, usdRate, eurRate),
  goal: valueToCurrencies(2000, usdRate, eurRate),
  twitch: {
    name: 'ostof',
    avatar:
      'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-70x70.png',
    isLive: false,
    url: 'https://www.twitch.tv/ostof',
  },
  hasActiveDonationMatch: false,
  donationMatchStartsAt: null,
}

export const demoUserData = (): UserDataType => ({
  campaign: demoCampaign,
  cause: demoCause,
})

// Schedules move to this year's event: the extension only shows live and upcoming streams, so
// 2025 dates would hide them. The money data keeps its 2025 date ("Raised in 2025").
const toThisYear = (date: Date) =>
  DateTime.fromJSDate(date, { zone: 'utc' })
    .plus({ years: DateTime.utc().year - DEMO_YEAR })
    .toJSDate()

export const demoSchedule = (
  schedule: YogsScheduleOutput,
): YogsScheduleOutput => {
  if (schedule.streams.length === 0) return schedule
  const stream = (s: StreamTVType): StreamTVType => ({
    ...s,
    start: toThisYear(s.start),
    end: toThisYear(s.end),
  })
  const days = schedule.days.map((d) => ({
    start: toThisYear(d.start),
    end: toThisYear(d.end),
    streams: d.streams.map(stream),
  }))
  // Same rule as scheduleForExtension: first day that hasn't ended, else the last day.
  const now = new Date()
  const initialDayIndex = days.findIndex((d) => now <= d.end)
  return {
    ...schedule,
    start: toThisYear(schedule.start),
    end: toThisYear(schedule.end),
    initialDayIndex:
      initialDayIndex === -1 ? Math.max(0, days.length - 1) : initialDayIndex,
    days,
    streams: schedule.streams.map(stream),
  }
}

// Made-up community schedule, 2025 times in UTC (moved to this year like the other schedules).
const demoStreams: [start: string, hours: number][] = [
  ['2025-12-01T18:00:00Z', 3],
  ['2025-12-03T19:00:00Z', 3],
  ['2025-12-06T17:00:00Z', 4],
  ['2025-12-09T19:00:00Z', 3],
  ['2025-12-12T19:00:00Z', 3],
  ['2025-12-14T17:00:00Z', 5],
]

export const demoUserSchedule = (): UserScheduleTVType => {
  const streams: StreamTVType[] = demoStreams.map(([start, hours], i) => {
    const from = DateTime.fromJSDate(toThisYear(new Date(start)), {
      zone: 'utc',
    })
    return {
      title: `Stream ${i + 1}`,
      start: from.toJSDate(),
      end: from.plus({ hours }).toJSDate(),
      creators: [
        {
          id: 'ostof',
          name: 'ostof',
          url: 'https://twitch.tv/ostof',
          color: '#3485C0',
        },
      ],
      color: getStreamColors(from)['500'],
    }
  })
  return {
    title: 'Demo Schedule',
    start: streams[0]!.start,
    end: streams[streams.length - 1]!.end,
    streams,
  }
}

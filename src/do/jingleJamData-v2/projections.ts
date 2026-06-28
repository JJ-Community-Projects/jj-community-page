import type {
  JJCampaignTVType,
  JJCauseTVType,
} from '../../lib/orpc/public/twitchExtension/contract.ts'
import type { JJCampaignType } from '../../lib/orpc/private/jjData/contract.ts'
import type { JJCampaign, JJCause } from '../types/JJAPIModel.ts'
import { toCurrencies } from '../utils/currencyFormat.ts'
import { toYouTubeUrl } from '../utils/twitchLogins.ts'
import type { CampaignRow, CauseRow } from './schema.ts'

// Pure row -> public-shape mappers. No I/O. The exact field mapping is ported
// from the v1 DisplayBuilder; twitch/live/youtube fields that v1 resolved at
// build time now come straight off the denormalized campaign row.

export type UserWithTags = {
  userId: number
  tiltifySlug: string
  tags: Array<{
    name: string
    id: number
    slug: string
    color: string
    usage: number
  }>
}

// Rebuild the raw JJCampaign API shape from a row (for the non-display getters).
export function toRawCampaign(row: CampaignRow): JJCampaign {
  return {
    id: row.id,
    causeId: row.cause_id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    url: row.url,
    startTime: row.start_time,
    raised: row.raised,
    goal: row.goal,
    user: {
      name: row.user_name,
      slug: row.user_slug,
      avatar: row.user_avatar,
      url: row.user_url,
    },
  }
}

export function toRawCause(row: CauseRow): JJCause {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    description: row.description,
    url: row.url,
    donateUrl: row.donate_url,
    raised: row.raised,
    // `campaigns` count is not persisted; consumers of the raw cause use the
    // other fields. Kept for shape parity.
    campaigns: 0,
  }
}

// Extension/overlay TV campaign (JJCampaignSchema).
export function toCampaignTV(
  row: CampaignRow,
  usdRate: number,
  eurRate: number,
): JJCampaignTVType {
  const twitch =
    row.twitch_id !== ''
      ? {
          name: row.twitch_name || row.twitch_login,
          avatar: row.twitch_avatar || row.user_avatar || '',
          isLive: row.is_live === 1,
          url: `https://twitch.tv/${row.twitch_login}`,
        }
      : undefined

  return {
    tiltifySlug: row.user_slug,
    campaignName: row.name,
    tiltifyUrl: row.url,
    tiltifyName: row.user_name,
    tiltifyDescription: row.description,
    tiltifyCauseId: row.cause_id ? row.cause_id : undefined,
    avatar: row.user_avatar ?? '',
    raised: toCurrencies(row.raised, usdRate, eurRate),
    goal: toCurrencies(row.goal, usdRate, eurRate),
    twitch,
  }
}

export function toCauseTV(
  row: CauseRow,
  usdRate: number,
  eurRate: number,
): JJCauseTVType {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    description: row.description,
    url: row.url,
    donateUrl: row.donate_url,
    raised: toCurrencies(row.raised, usdRate, eurRate),
  }
}

// Community-page campaign (private JJCampaignSchema): twitch/youtube as URLs,
// tags + schedule link joined in from stored projections.
export function toCommunityCampaign(
  row: CampaignRow,
  usdRate: number,
  eurRate: number,
  userTags: Map<string, UserWithTags>,
  scheduleSlugs: Map<string, string>,
): JJCampaignType {
  const twitch =
    row.twitch_login !== ''
      ? `https://twitch.tv/${row.twitch_login}`
      : undefined
  const youtube = row.youtube_url ? toYouTubeUrl(row.youtube_url) : undefined
  const sSlug = scheduleSlugs.get(row.user_slug)

  return {
    campaignName: row.name,
    tiltifyUrl: row.url,
    tiltifySlug: row.user_slug,
    tiltifyName: row.user_name,
    tiltifyDescription: row.description || undefined,
    tiltifyCauseId: row.cause_id,
    avatar: row.twitch_avatar || row.user_avatar || '',
    raised: toCurrencies(row.raised, usdRate, eurRate),
    twitch,
    youtube,
    isTwitchLive: row.is_live === 1,
    scheduleUrl: sSlug ? `/schedules/${sSlug}` : undefined,
    tags: userTags.get(row.user_slug)?.tags ?? [],
  }
}

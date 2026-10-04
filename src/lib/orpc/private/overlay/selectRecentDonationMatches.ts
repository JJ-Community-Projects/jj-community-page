import type { JJCampaignTVType } from '../../public/twitchExtension/contract.ts'
import type { DonationMatchItem } from './contract.ts'

// Picks the most recently started active donation matches from a campaign
// display projection. Campaigns whose match is inactive, whose start is
// missing/unparseable, or which have no Twitch channel are dropped.
export function selectRecentDonationMatches(
  campaigns: readonly JJCampaignTVType[],
  limit: number,
): DonationMatchItem[] {
  const picked: { match: DonationMatchItem; ms: number }[] = []

  for (const c of campaigns) {
    if (!c.hasActiveDonationMatch) continue

    // DO records normally carry a Date; tolerate an ISO string from legacy
    // records rather than dropping the whole list.
    const raw = c.donationMatchStartsAt
    const startsAt =
      raw == null ? null : raw instanceof Date ? raw : new Date(String(raw))
    if (startsAt === null) continue

    const ms = startsAt.getTime()
    if (Number.isNaN(ms)) continue

    const channelUrl = c.twitch?.url
    if (!channelUrl) continue

    picked.push({
      match: {
        campaignName: c.campaignName,
        channelUrl,
        twitchName: c.twitch?.name,
        startsAt,
        avatar: c.twitch?.avatar,
      },
      ms,
    })
  }

  picked.sort((a, b) => b.ms - a.ms)
  return picked.slice(0, limit).map((p) => p.match)
}

import type {
  CommunityFundraiser,
  CommunityList,
  JJCampaignType,
  JJCauseType,
  UserWithInfo,
} from '../orpc/private/jjData/contract.ts'
import { normalizeTwitchLogin } from '../../do/utils/twitchLogins.ts'

// The community page lists the top N campaigns by raised, plus every account holder.
export const COMMUNITY_TOP_N = 100

export interface CommunityListSources {
  /** All account holders (`getUsers`) */
  users: UserWithInfo[]
  /** All JJ campaigns of this year (`getCommunityCampaignsDisplayAll`) */
  campaigns: JJCampaignType[]
  /** Twitch logins currently live (`getLiveLogins`) */
  liveLogins: string[]
  causes: JJCauseType[]
}

const slugKey = (slug: string) => slug.trim().toLowerCase()

// One campaign per Tiltify user; if a user has several, the highest raised wins.
function campaignsBySlug(campaigns: JJCampaignType[]) {
  const map = new Map<string, JJCampaignType>()
  for (const c of campaigns) {
    if (!c.tiltifySlug) continue
    const key = slugKey(c.tiltifySlug)
    const prev = map.get(key)
    if (!prev || c.raised.gbp > prev.raised.gbp) map.set(key, c)
  }
  return map
}

function compareFundraisers(a: CommunityFundraiser, b: CommunityFundraiser) {
  if (a.hasActiveDonationMatch !== b.hasActiveDonationMatch) {
    return a.hasActiveDonationMatch ? -1 : 1
  }
  if (a.isLive !== b.isLive) return a.isLive ? -1 : 1
  const ra = a.raised?.gbp ?? null
  const rb = b.raised?.gbp ?? null
  if (ra !== rb) {
    if (ra === null) return 1
    if (rb === null) return -1
    return rb - ra
  }
  const byName = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  if (byName !== 0) return byName
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

// Merges the top N campaigns with all account holders (overlap = same lowercased
// Tiltify slug) and sorts by dono match → live → raised (GBP desc) → name.
export function buildCommunityList(
  { users, campaigns, liveLogins, causes }: CommunityListSources,
  topN = COMMUNITY_TOP_N,
): CommunityList {
  const live = new Set(liveLogins.map((l) => normalizeTwitchLogin(l)))
  const causeById = new Map(causes.map((c) => [c.id, c]))
  const bySlug = campaignsBySlug(campaigns)

  const charityOf = (c: JJCampaignType) => {
    const cause = c.tiltifyCauseId ? causeById.get(c.tiltifyCauseId) : undefined
    return cause ? { id: cause.id, name: cause.name, logo: cause.logo } : null
  }

  const items = new Map<string, CommunityFundraiser>()

  for (const u of users) {
    const key = slugKey(u.tiltifySlug)
    if (!key || items.has(key)) continue
    const c = bySlug.get(key)
    const login = normalizeTwitchLogin(u.twitchLogin || c?.twitch)
    items.set(key, {
      key,
      name: u.username,
      avatar: u.profileImage || c?.avatar || '',
      charity: c ? charityOf(c) : null,
      raised: c?.raised ?? null,
      tiltifyUrl: c?.tiltifyUrl ?? u.tiltifyUrl,
      profileUrl: `/${key}`,
      twitchUrl: login ? `https://twitch.tv/${login}` : null,
      isLive: login ? live.has(login) : false,
      hasActiveDonationMatch: c?.hasActiveDonationMatch ?? false,
      tags: u.tags.map(({ tagId, name, slug, color, usage }) => ({
        id: tagId,
        name,
        slug,
        color,
        usage,
      })),
    })
  }

  const top = [...bySlug.entries()]
    .sort(([, a], [, b]) => b.raised.gbp - a.raised.gbp)
    .slice(0, topN)
  for (const [key, c] of top) {
    if (items.has(key)) continue
    items.set(key, {
      key,
      name: c.tiltifyName,
      avatar: c.avatar,
      charity: charityOf(c),
      raised: c.raised,
      tiltifyUrl: c.tiltifyUrl,
      profileUrl: null,
      twitchUrl: c.twitch ?? null,
      isLive: c.isTwitchLive,
      hasActiveDonationMatch: c.hasActiveDonationMatch,
      tags: c.tags,
    })
  }

  const list = [...items.values()].sort(compareFundraisers)
  return { count: list.length, topN, list }
}

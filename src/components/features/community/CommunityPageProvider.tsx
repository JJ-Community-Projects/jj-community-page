import {
  createContext,
  createMemo,
  createSignal,
  type ParentComponent,
  useContext,
} from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { makePersisted } from '@solid-primitives/storage'
import type { CharitiesStatic } from '../../../content/schema.ts'
import type { JJCauseType } from '../../../lib/orpc/private/jjData/contract.ts'

const useCommunityPageHook = (charitiesData?: CharitiesStatic) => {
  const overviewQuery = useQuery(() =>
    orpcPrivate.jj.overview.queryOptions({
      staleTime: 60_000,
      refetchInterval: 60_000 * 2,
    }),
  )

  const communityQuery = useQuery(() =>
    orpcPrivate.jj.campaigns.queryOptions({
      staleTime: 60_000 * 4,
      refetchInterval: 60_000 * 5,
    }),
  )

  const causeQuery = useQuery(() =>
    orpcPrivate.jj.causes.queryOptions({
      staleTime: 60_000 * 4,
      refetchInterval: 60_000 * 5,
    }),
  )

  const upcomingStreamsQuery = useQuery(() =>
    orpcPrivate.jj.upcomingStreams.queryOptions({
      staleTime: 60_000 * 8,
      refetchInterval: 60_000 * 10,
    }),
  )
  const users = useQuery(() =>
    orpcPrivate.jj.getAllUsersWithInfo.queryOptions({
      staleTime: 60_000 * 8,
      refetchInterval: 60_000 * 10,
    }),
  )

  const [sortBy, setSortBy] = makePersisted(
    createSignal<'raised' | 'live' | 'cause'>('live'),
  )

  const [currency, setCurrency] = makePersisted(
    createSignal<'GBP' | 'USD' | 'EUR'>('GBP'),
  )

  // Selected tags for community page filtering/searching
  const [selectedTagIds, setSelectedTagIds] = createSignal<number[]>([])

  const addSelectedTag = (id: number) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }
  const removeSelectedTag = (id: number) => {
    setSelectedTagIds((prev) => prev.filter((x) => x !== id))
  }
  const clearSelectedTags = () => setSelectedTagIds([])

  const campaignsByCause = () => {
    if (!causeQuery.data) return []
    if (!communityQuery.data) return []
    return causeQuery.data!.causes.map((cause) => {
      return {
        cause: cause,
        campaigns: communityQuery.data!.list.filter(
          (campaign) => campaign.tiltifyCauseId === cause.id,
        ),
      }
    })
  }

  const campaignsSortedByLiveFirst = () => {
    if (!communityQuery.data) return []
    return communityQuery.data!.list.toSorted((a, b) => {
      if (a.isTwitchLive && !b.isTwitchLive) return -1
      if (!a.isTwitchLive && b.isTwitchLive) return 1
      return 0
    })
  }

  const campaignsSortedByRaised = () => {
    if (!communityQuery.data) return []
    return communityQuery.data!.list.toSorted((a, b) => {
      if (a.raised.gbp < b.raised.gbp) return 1
      if (a.raised.gbp > b.raised.gbp) return -1
      return 0
    })
  }

  // Helper: compute match count of an entity's tags vs selectedTagIds
  const matchCount = (tagIds: number[]) => {
    const selected = selectedTagIds()
    if (selected.length === 0) return 0
    let c = 0
    for (let i = 0; i < tagIds.length; i++) {
      if (selected.includes(tagIds[i])) c++
    }
    return c
  }

  const baseSortedCampaigns = () =>
    sortBy() === 'live'
      ? campaignsSortedByLiveFirst()
      : campaignsSortedByRaised()

  // Sorted campaigns with optional tag filtering and prioritization
  const campaignsSorted = createMemo(() => {
    const base = baseSortedCampaigns()
    const selected = selectedTagIds()
    if (selected.length === 0) return base
    return base
      .map((c, i) => ({ c, i, mc: matchCount(c.tags.map((t) => t.id)) }))
      .filter((x) => x.mc > 0)
      .toSorted((a, b) => {
        if (a.mc !== b.mc) return b.mc - a.mc
        return a.i - b.i
      })
      .map((x) => x.c)
  })

  // filtered/prioritized users by selected tags
  const usersFiltered = createMemo(() => {
    const selected = selectedTagIds()
    const list = users.data ? users.data : []
    if (selected.length === 0) return list
    return list
      .map((u, i) => ({ u, i, mc: matchCount(u.tags.map((t) => t.tagId)) }))
      .filter((x) => x.mc > 0)
      .toSorted((a, b) => (a.mc !== b.mc ? b.mc - a.mc : a.i - b.i))
      .map((x) => x.u)
  })

  // campaigns by cause with tag filtering/prioritization
  const campaignsByCauseFiltered = createMemo(() => {
    const selected = selectedTagIds()
    if (!causeQuery.data || !communityQuery.data)
      return [] as ReturnType<typeof campaignsByCause>
    const allByCause = campaignsByCause()
    if (selected.length === 0) return allByCause
    return allByCause
      .map((entry) => {
        const enriched = entry.campaigns
          .map((c, i) => ({ c, i, mc: matchCount(c.tags.map((t) => t.id)) }))
          .filter((x) => x.mc > 0)
          .toSorted((a, b) => (a.mc !== b.mc ? b.mc - a.mc : a.i - b.i))
          .map((x) => x.c)
        return { cause: entry.cause, campaigns: enriched }
      })
      .filter((e) => e.campaigns.length > 0)
  })

  const mergedCharityItems = createMemo(() => {

    const c = causeQuery.data
    if (!c) {
      return []
    }
    const map = new Map<string, JJCauseType>(c.causes.map((c) => [c.id, c]))
    return (
      charitiesData?.charities.map((c) => {
        return {
          donationData: map.get(c.tiltify_id),
          staticData: c,
        }
      }) ?? []
    )
  })

  return {
    community: communityQuery,
    cause: causeQuery,
    upcomingStreams: upcomingStreamsQuery,
    overview: overviewQuery,
    sortBy,
    setSortBy,
    currency,
    setCurrency,
    campaignsSorted,
    campaignsByCause,
    users,
    // tag selection state (community page)
    selectedTagIds,
    addSelectedTag,
    removeSelectedTag,
    clearSelectedTags,
    usersFiltered,
    campaignsByCauseFiltered,
    mergedCharityItems,
  }
}

interface CommunityPageProps {
  charitiesData?: CharitiesStatic
}

const CommunityPageContext =
  createContext<ReturnType<typeof useCommunityPageHook>>()

export const CommunityPageProvider: ParentComponent<CommunityPageProps> = (
  props,
) => {
  const hook = useCommunityPageHook(props.charitiesData)
  return (
    <CommunityPageContext.Provider value={hook}>
      {props.children}
    </CommunityPageContext.Provider>
  )
}
export const useCommunityPage = () => useContext(CommunityPageContext)!

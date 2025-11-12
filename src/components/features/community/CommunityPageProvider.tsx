import { createContext, createMemo, createSignal, type ParentComponent, useContext, } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { makePersisted } from '@solid-primitives/storage'

const useCommunityPageHook = () => {
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

  const [sortBy, setSortBy] = makePersisted(
    createSignal<'raised' | 'live' | 'cause'>('live'),
  )

  const [currency, setCurrency] = makePersisted(
    createSignal<'GBP' | 'USD' | 'EUR'>('GBP'),
  )

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

  const campaignsSorted = createMemo(() => {
    if (sortBy() === 'live') {
      return campaignsSortedByLiveFirst()
    }
    return campaignsSortedByRaised()
  })

  return {
    community: communityQuery,
    cause: causeQuery,
    upcomingStreams: upcomingStreamsQuery,
    sortBy,
    setSortBy,
    currency,
    setCurrency,
    campaignsSorted,
    campaignsByCause,
  }
}

interface CommunityPageProps {}

const CommunityPageContext =
  createContext<ReturnType<typeof useCommunityPageHook>>()

export const CommunityPageProvider: ParentComponent<CommunityPageProps> = (
  props,
) => {
  const hook = useCommunityPageHook()
  return (
    <CommunityPageContext.Provider value={hook}>
      {props.children}
    </CommunityPageContext.Provider>
  )
}
export const useCommunityPage = () => useContext(CommunityPageContext)!

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
import { useCurrency } from '../../common/CurrencyProvider.tsx'
import type {
  CommunityFundraiser,
  JJCauseType,
} from '../../../lib/orpc/private/jjData/contract.ts'
import { raisedIn } from './Money.tsx'

const useCommunityPageHook = () => {
  // One merged list: top N campaigns ∪ all account holders, sorted by the backend (community-list)
  const communityQuery = useQuery(() =>
    orpcPrivate.jj.communityList.queryOptions({
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
    { name: 'community-sort-by' },
  )

  const { currency, setCurrency } = useCurrency()

  // Selected tags for community page filtering/searching
  const [selectedTagIds, setSelectedTagIds] = createSignal<number[]>([])

  const addSelectedTag = (id: number) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }
  const removeSelectedTag = (id: number) => {
    setSelectedTagIds((prev) => prev.filter((x) => x !== id))
  }
  const clearSelectedTags = () => setSelectedTagIds([])

  // Tag filter: keeps fundraisers with any selected tag, in the current order
  const fundraisers = createMemo(() => {
    const list = communityQuery.data?.list ?? []
    const selected = selectedTagIds()
    if (selected.length === 0) return list
    return list.filter((f) => f.tags.some((t) => selected.includes(t.id)))
  })

  // Live: the backend order (dono match, live, raised, name). Raised: by the selected currency,
  // fundraisers without a campaign last; toSorted is stable, so ties keep the backend order.
  const fundraisersSorted = createMemo(() => {
    const list = fundraisers()
    if (sortBy() !== 'raised') return list
    const c = currency()
    return list.toSorted((a, b) => {
      if (a.raised === null || b.raised === null) {
        return (a.raised === null ? 1 : 0) - (b.raised === null ? 1 : 0)
      }
      return raisedIn(b.raised, c) - raisedIn(a.raised, c)
    })
  })

  // Cause: one group per charity in causes order, then campaigns without a known charity, then
  // account holders without a campaign. Empty charity groups only show while no tag is selected.
  const fundraisersByCause = createMemo((): CauseGroup[] => {
    const list = fundraisers()
    const causes = causeQuery.data?.causes ?? []
    const known = new Set(causes.map((c) => c.id))
    const showEmpty = selectedTagIds().length === 0
    const groups: CauseGroup[] = causes.map((cause) => ({
      key: cause.id,
      title: cause.name,
      cause,
      fundraisers: list.filter((f) => f.charity?.id === cause.id),
    }))
    groups.push(
      {
        key: 'other',
        title: 'Other fundraisers',
        fundraisers: list.filter(
          (f) => f.raised !== null && !(f.charity && known.has(f.charity.id)),
        ),
      },
      {
        key: 'no-campaign',
        title: 'No campaign yet',
        fundraisers: list.filter((f) => f.raised === null),
      },
    )
    return groups.filter(
      (g) => g.fundraisers.length > 0 || (showEmpty && g.cause),
    )
  })

  return {
    community: communityQuery,
    upcomingStreams: upcomingStreamsQuery,
    sortBy,
    setSortBy,
    currency,
    setCurrency,
    fundraisersSorted,
    fundraisersByCause,
    // tag selection state (community page)
    selectedTagIds,
    addSelectedTag,
    removeSelectedTag,
    clearSelectedTags,
  }
}

export type CauseGroup = {
  key: string
  title: string
  /** Set for a charity group; the trailing groups have none */
  cause?: JJCauseType
  fundraisers: CommunityFundraiser[]
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

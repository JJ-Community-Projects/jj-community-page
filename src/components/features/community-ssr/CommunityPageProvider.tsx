import { createContext, createMemo, createSignal, onMount, type ParentComponent, useContext, } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { makePersisted } from '@solid-primitives/storage'
import type { CommunityList } from '../../../lib/orpc/private/jjData/contract.ts'

export interface CommunityInitialData {
  community?: CommunityList
  upcomingStreams?: any
}

const useCommunityPageHook = (initial?: CommunityInitialData) => {
  const [enable, setEnable] = createSignal<boolean>(false)

  onMount(() => setEnable(true))

  // One merged list: top N campaigns ∪ all account holders, sorted by the backend (community-list)
  const communityQuery = useQuery(() =>
    orpcPrivate.jj.communityList.queryOptions({
      staleTime: 60_000 * 4,
      refetchInterval: 60_000 * 5,
      enabled: enable(),
      placeholderData: (prev) => prev ?? initial?.community,
      experimental_prefetchInRender: true,
    }),
  )

  const upcomingStreamsQuery = useQuery(() =>
    orpcPrivate.jj.upcomingStreams.queryOptions({
      staleTime: 60_000 * 8,
      refetchInterval: 60_000 * 10,
      enabled: enable(),
      placeholderData: (prev) => prev ?? initial?.upcomingStreams,
      experimental_prefetchInRender: true,
    }),
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

  // Tag filter: keeps fundraisers with any selected tag, in the backend order
  const fundraisers = createMemo(() => {
    const list = communityQuery.data?.list ?? []
    const selected = selectedTagIds()
    if (selected.length === 0) return list
    return list.filter((f) => f.tags.some((t) => selected.includes(t.id)))
  })

  return {
    community: communityQuery,
    upcomingStreams: upcomingStreamsQuery,
    currency,
    setCurrency,
    fundraisers,
    // tag selection state (community page)
    selectedTagIds,
    addSelectedTag,
    removeSelectedTag,
    clearSelectedTags,
  }
}

interface CommunityPageProps {
  initial?: CommunityInitialData
}

const CommunityPageContext =
  createContext<ReturnType<typeof useCommunityPageHook>>()

export const CommunityPageProvider: ParentComponent<CommunityPageProps> = (
  props,
) => {
  const hook = useCommunityPageHook(props.initial)
  return (
    <CommunityPageContext.Provider value={hook}>
      {props.children}
    </CommunityPageContext.Provider>
  )
}
export const useCommunityPage = () => useContext(CommunityPageContext)!

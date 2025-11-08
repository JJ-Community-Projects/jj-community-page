import { createContext, createSignal, type ParentComponent, useContext, } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'

const useCommunityPageHook = () => {
  const communityQuery = useQuery(() =>
    orpcPrivate.jj.campaigns.queryOptions({}),
  )

  const causeQuery = useQuery(() => orpcPrivate.jj.causes.queryOptions({}))

  const [sortBy, setSortBy] = createSignal<'raised' | 'live' | 'cause'>(
    'raised',
  )

  return {
    community: communityQuery,
    cause: causeQuery,
    sortBy,
    setSortBy,
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

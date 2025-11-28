import {
  createContext,
  createMemo,
  createSignal,
  type ParentComponent,
  useContext,
} from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import type { JJCauseType } from '../../../lib/orpc/private/jjData/contract.ts'
import { makePersisted } from '@solid-primitives/storage'
import type { CharitiesStatic } from '../../../content/schema.ts'

const useCharityOverviewHook = (charitiesData?: CharitiesStatic) => {
  const overview = useQuery(() =>
    orpcPrivate.jj.overview.queryOptions({
      staleTime: 60_000,
      refetchInterval: 60_000 * 2,
    }),
  )
  const causeQuery = useQuery(() =>
    orpcPrivate.jj.causes.queryOptions({
      staleTime: 60_000 * 4,
      refetchInterval: 60_000 * 5,
    }),
  )
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

  const [charityOpen, setCharityOpen] = makePersisted(
    createSignal<boolean>(true),
    {
      name: 'charity-overview-open',
    }
  )

  return {
    overview,
    cause: causeQuery,
    mergedCharityItems,
    charityOpen,
    setCharityOpen,
  }
}

interface CharityOverviewProps {
  charitiesData?: CharitiesStatic
}

const CharityOverviewContext =
  createContext<ReturnType<typeof useCharityOverviewHook>>()

export const CharityOverviewProvider: ParentComponent<CharityOverviewProps> = (
  props,
) => {
  const hook = useCharityOverviewHook(props.charitiesData)
  return (
    <CharityOverviewContext.Provider value={hook}>
      {props.children}
    </CharityOverviewContext.Provider>
  )
}
export const useCharityOverview = () => useContext(CharityOverviewContext)!

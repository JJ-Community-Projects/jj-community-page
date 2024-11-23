import {createContext, createEffect, createSignal, onMount, type ParentComponent, useContext} from "solid-js";
import {useYogsSchedule} from "./YogsScheduleProvider.tsx";
import type {FullStream} from "../../../../lib/model/ContentTypes.ts";
import { log } from "#lib/analytics.ts";

const useCreatorFilterHook = () => {

  const {creators, streams} = useYogsSchedule()

  const idMap = new Map<string, string>()
  for (const c of creators()) {
    idMap.set(c.name.toLowerCase().replace(' ', '_'), c.id)
  }

  const [filter, setFilter] = createSignal<string[]>([])
  const [and, setAnd] = createSignal<boolean>(false)
  onMount(() => {
    const url = new URL(window.location.href)
    const filter = url.searchParams.get('filter')
    const type = url.searchParams.get('filterType')
    setFilter(filter ? filter.split(',') : [])
    if (type == 'and') {
      setAnd(true)
    } else {
      setAnd(false)
    }
  })

  createEffect(() => {
    const url = new URL(window.location.href)
    if (filter().length == 0) {
      url.searchParams.delete('filter')
    } else {
      url.searchParams.set('filter', filter().join(','))
    }
    if (and()) {
      url.searchParams.set('filterType', 'and')
    } else {
      url.searchParams.delete('filterType')
    }
    window.history.pushState({}, '', url.toString())
  })

  const addFilter = (id: string) => {
    setFilter([...filter(), id])
  }
  const removeFilter = (id: string) => {
    setFilter(filter().filter(i => i != id))
  }

  const includesFilter = (id: string) => filter().includes(id)
  const toggleFilter = (id: string) => {
    if (includesFilter(id)) {
      removeFilter(id)
    } else {
      addFilter(id)
    }
  }
  const toggleAnd = () => setAnd((v) => !v)

  const isEmpty = () => filter().length == 0

  const reset = () => {
    setFilter([])
  }
  const isSlotPartOfFilter = (stream: FullStream) => {
    if (isEmpty()) {
      return true
    }
    const streamIds: string[] = stream.creators.map((c) => c.id)
    if (and()) {
      return filter().every(id => streamIds.includes(id))
    } else {
      return filter().some(id => streamIds.includes(id))
    }
  }

  const filteredStreams = () => streams().filter(isSlotPartOfFilter)
  const appearanceCount = (id: string) => {
    return streams().filter(s => {
      const streamIds: string[] = s.creators.map((c) => c.id)
      return streamIds.includes(id)
    }).length
  }
  const [sortByName, setSortByName] = createSignal(true)

  const toggleSortByName = () => setSortByName(v => !v)
  const makeLink = () => {
    const names = filter().join(',')
    let filterType = ''
    if (filter().length > 1) {
      filterType = `filterType=${and() ? 'and' : 'or'}&`
    }
    const url = `https://jinglejam.ostof.dev${location.pathname}?${filterType}filter=${names}`
    return encodeURI(url)
  }

  const copyFilterUrl = async () => {
    const url = makeLink()
    try {
      let copyValue = ''
      if (url) {
        copyValue = url
      }
      await navigator.clipboard.writeText(copyValue)
      log('filter_copy', {
        filter_url: url,
      })
    } catch (e: any) {
      console.log(e.toString())
    }
    try {
      window.alert(`Copied ${url} to your clipboard`)
    } catch (e: any) {
      console.log(e.toString())
    }
  }
  return {
    filter,
    and,
    addFilter,
    removeFilter,
    includesFilter,
    toggleFilter,
    toggleAnd,
    isEmpty,
    reset,
    filteredStreams,
    appearanceCount,
    sortByName, setSortByName, toggleSortByName,
    isSlotPartOfFilter,
    copyFilterUrl
  }
}

interface CreatorFilterProps {
}

const CreatorFilterContext = createContext<ReturnType<typeof useCreatorFilterHook>>();

export const CreatorFilterProvider: ParentComponent<CreatorFilterProps> = (props) => {
  const hook = useCreatorFilterHook()
  return (
    <CreatorFilterContext.Provider value={hook}>
      {props.children}
    </CreatorFilterContext.Provider>
  );
}
export const useCreatorFilter = () => useContext(CreatorFilterContext)!

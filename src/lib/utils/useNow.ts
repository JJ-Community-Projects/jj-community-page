import {createSignal, onCleanup} from 'solid-js'
import {isServer} from 'solid-js/web'
import {DateTime} from 'luxon'

const london = 'Europe/London'

export const useDatetimeLondonNow = (init?: DateTime) => {
  const [date, setDate] = createSignal(init ?? DateTime.now().setZone(london))
  // No ticking on the server: a server render is a single snapshot
  if (isServer) return date
  const interval = setInterval(() => setDate(init ?? DateTime.now().setZone(london)), 1000)
  onCleanup(() => clearInterval(interval))
  return date
}

export const useNow = (init?: DateTime) => {
  const [date, setDate] = createSignal(init ?? DateTime.now().setZone('utc'))
  if (isServer) return date
  const interval = setInterval(() => setDate(init ?? DateTime.now().setZone('utc')), 1000)
  onCleanup(() => clearInterval(interval))
  return date
}

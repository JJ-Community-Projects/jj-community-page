import {
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../../lib/utils/jjDates.ts'
import { type Component, Show } from 'solid-js'

export const MainCountdownSimple: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()
  return (
    <Show when={!isJJ()}>
      <div class={'mt-3 flex flex-col items-center sm:mt-4'}>
        <p class={'text-lg font-semibold sm:text-xl'}>
          Jingle Jam {nextJJStartDate().year} starts in
        </p>
        <p class={'font-mono text-2xl tabular-nums tracking-tight sm:text-3xl'}>
          {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
        </p>
      </div>
    </Show>
  )
}

export const MainJJStartTimes: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const localTimeZone = () => nextJJStartDate().toLocal().zoneName
  const ukTimeZone = () => nextJJStartDate().zoneName
  const isLocalTimeZoneUK = () => localTimeZone() === ukTimeZone()
  return (
    <div class={'flex w-full flex-row justify-between gap-2 p-2'}>
      <div class={'flex-1'}>
        <p class={'mt-2 text-white/60 sm:text-xs'}>Your local time</p>
        <p class={'text-lg sm:text-xl'}>
          {nextJJStartDate().toLocal().toFormat('DDDD')}
        </p>
        <p class={'text-lg sm:text-xl'}>
          {nextJJStartDate().toLocal().toFormat('ttt')}
        </p>
      </div>
      <Show when={!isLocalTimeZoneUK()}>
        <div class={'flex-1'}>
          <p class={'mt-2 text-white/60 sm:text-xs'}>UK time</p>
          <p class={'text-lg sm:text-xl'}>
            {nextJJStartDate().toFormat('DDDD')}
          </p>
          <p class={'text-lg sm:text-xl'}>
            {nextJJStartDate().toFormat('ttt')}
          </p>
        </div>
      </Show>
    </div>
  )
}

export const MainHeader: Component = () => {
  return (
    <div
      class={
        'flex w-full flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white text-white/90 sm:gap-2 sm:p-6'
      }
    >
      <div class="flex flex-col items-center justify-center p-2 text-white">
        <p class="w-full text-center ~text-2xl/4xl">The Jingle Jam Community</p>
        <p class="text-center ~text-lg/xl">
          A central place to showcase the streams of the Jingle Jam!
        </p>
      </div>
      <MainCountdownSimple />

      <MainJJStartTimes />
    </div>
  )
}

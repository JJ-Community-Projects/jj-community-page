import { Show } from 'solid-js'
import {
  useIsBeforeJJ,
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../../lib/utils/jjDates.ts'
import { MainJJStartTimes } from '../../common/ui/MainHeader.tsx'

export const CollectionCountdown = () => {
  const isJJ = useIsJJ()

  const isBefore = useIsBeforeJJ()

  return (
    <>
      <Show when={isJJ()}>
        <JJIsLive />
      </Show>
      <Show when={!isJJ() && isBefore()}>
        <Countdown />
      </Show>
    </>
  )
}

const Countdown = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  return (
    <div
      class={
        'flex w-full flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white text-white/90 sm:p-4'
      }
    >
      <p class={'text-xl'}>Is the collection live?</p>
      <p class={'text-6xl'}>No</p>
      <div class={'mt-3 flex flex-col items-center sm:mt-4'}>
        <p class={'text-lg font-semibold sm:text-xl'}>
          The collection goes live in
        </p>
        <p class={'font-mono text-2xl tabular-nums tracking-tight sm:text-3xl'}>
          {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
        </p>
      </div>
      <MainJJStartTimes />
    </div>
  )
}

const JJIsLive = () => {
  return (
    <div
      class={
        'flex w-full flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white text-white/90 sm:p-4'
      }
    >
      <p class={'text-xl'}>Is the collection live?</p>
      <p class={'text-6xl'}>YES</p>
      <a href={'https://jinglejam.tiltify.com'}>
        <button class="btn btn-primary">Donate to the Jingle Jam</button>
      </a>
    </div>
  )
}

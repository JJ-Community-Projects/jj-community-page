import { Show } from 'solid-js'
import {
  useIsBeforeJJ,
  useIsJJ,
  useJJStartCountdown,
  useNextJJStartDate,
} from '../../../lib/utils/jjDates.ts'
import { MainJJStartTimes } from '../../common/ui/MainHeader.tsx'

// The card and its h1 ("Is the collection live?") are rendered by the page; this fills in the answer.
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
  const jjStartCountdown = useJJStartCountdown()
  return (
    <>
      <p class={'text-6xl'}>No</p>
      <p>
        Checkout the{' '}
        <a href={'/yogs'} class={'underline'}>
          Yogs Schedule
        </a>{' '}
        and the{' '}
        <a href={'/community/schedule'} class={'underline'}>
          Community Streams
        </a>
      </p>
      <div class={'mt-3 flex flex-col items-center sm:mt-4'}>
        <p class={'text-lg font-semibold sm:text-xl'}>
          The collection goes live in
        </p>
        <p class={'font-mono text-2xl tabular-nums tracking-tight sm:text-3xl'}>
          {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
        </p>
      </div>
      <MainJJStartTimes />
    </>
  )
}

const JJIsLive = () => {
  return (
    <>
      <p class={'text-6xl'}>YES</p>
      <a href={'https://jinglejam.tiltify.com'} class={'underline'}>Donate to the Jingle Jam</a>
    </>
  )
}

import { Show } from 'solid-js'
import {
  useIsBeforeJJ,
  useIsJJ,
  useJJStartCountdown,
} from '../../../lib/utils/jjDates.ts'
import { Button } from '../../ui/Button'
import { Countdown, JJStartTimes } from '../../ui/Countdown'

// The tile and its h1 ("Is the collection live?") are rendered by the page; this fills in the answer.
export const CollectionCountdown = () => {
  const isJJ = useIsJJ()
  const isBefore = useIsBeforeJJ()

  return (
    <>
      <Show when={isJJ()}>
        <JJIsLive />
      </Show>
      <Show when={!isJJ() && isBefore()}>
        <NotLiveYet />
      </Show>
    </>
  )
}

const answer = 'text-6xl font-black tracking-tight'

const NotLiveYet = () => {
  const jjStartCountdown = useJJStartCountdown()
  return (
    <div class="flex w-full flex-col items-center gap-4">
      <p class={answer}>No</p>
      <Countdown
        label="The collection goes live in"
        duration={jjStartCountdown()}
      />
      <JJStartTimes class="max-w-lg" />
      <p class="text-fg-muted text-sm">
        Meanwhile, check out the{' '}
        <a href="/yogs" class="text-fg font-medium underline">
          Yogs schedule
        </a>{' '}
        and the{' '}
        <a href="/community/schedule" class="text-fg font-medium underline">
          community streams
        </a>
        .
      </p>
    </div>
  )
}

const JJIsLive = () => (
  <div class="flex flex-col items-center gap-4">
    <p class={answer}>Yes</p>
    <Button href="https://jinglejam.tiltify.com" variant="primary">
      Donate to the Jingle Jam
    </Button>
  </div>
)

import { type Component, Show } from 'solid-js'
import { useIsJJ, useJJStartCountdown, useNextJJStartDate } from '../../../../lib/utils/jjDates.ts'

// The countdown on the right of the /teams header card; the card and its h1 are rendered by the page.
export const TeamsIndexCountdown: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()

  return (
    <Show when={!isJJ()}>
      <div class="flex flex-col items-center text-center md:items-end md:text-right">
        <p class={'text-lg font-semibold'}>
          Jingle Jam {nextJJStartDate().year} starts in
        </p>
        <p class={'font-mono text-xl tabular-nums tracking-tight'}>
          {jjStartCountdown().toFormat("dd'd' hh'h' mm'm' ss's'")}
        </p>
      </div>
    </Show>
  )
}

export default TeamsIndexCountdown

import { type Component, Show } from 'solid-js'
import { FaSolidUser } from 'solid-icons/fa'
import { useIsJJ, useJJStartCountdown, useNextJJStartDate } from '../../../../lib/utils/jjDates.ts'

export const UsersIndexHeader: Component = () => {
  const nextJJStartDate = useNextJJStartDate()
  const jjStartCountdown = useJJStartCountdown()
  const isJJ = useIsJJ()

  return (
    <div class="rounded-xl border-2 bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 shadow-md transition-all duration-300 hover:shadow-lg">
      <div class="flex w-full flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:p-2 lg:p-4">
        {/* Left: Title, icon (center on small, left on md+) */}
        <div class="flex flex-col items-center text-center md:items-start md:text-left">
          <div class="flex items-center gap-2">
            <FaSolidUser class="h-8 w-8 text-neutral-600" />
            <h1 class="font-bold text-black ~text-2xl/4xl">Users</h1>
          </div>
        </div>

        {/* Right: Countdown (center on small, right on md+) */}
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
      </div>
    </div>
  )
}

export default UsersIndexHeader

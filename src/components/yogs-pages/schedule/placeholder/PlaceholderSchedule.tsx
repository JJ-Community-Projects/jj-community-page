import { type Component, For } from 'solid-js'
import { Skeleton } from '../../../ui/Status'
import '../yogs-schedule.css'

const DAYS = Array.from({ length: 7 })
const SLOTS = Array.from({ length: 4 })
const ROWS = Array.from({ length: 4 })

const block = 'rounded-tile size-full bg-white/20'

/**
 * While the client-only pages load the schedule: skeleton tiles in the grid's shape (desktop) and
 * the timeline's (mobile), sized by yogs-schedule.css like the real grid. Needs no data.
 */
export const PlaceholderSchedule: Component = () => (
  <div class="flex w-full flex-col items-center" aria-busy="true" aria-label="Loading the schedule">
    <div class="desktop-schedule flex w-full justify-center">
      <div class="yogs-grid flex flex-col">
        <div class="data-height flex w-full flex-row">
          <div class="data-width" />
          <div class="yogs-cell header-title-card-width h-full">
            <Skeleton class={block} />
          </div>
          <div class="stream-width" />
          <For each={SLOTS.slice(1)}>
            {() => (
              <div class="yogs-cell stream-width h-full">
                <Skeleton class={block} />
              </div>
            )}
          </For>
        </div>
        <div class="flex flex-row">
          <div class="data-width flex flex-col">
            <div class="yogs-cell timezone">
              <Skeleton class={block} />
            </div>
            <For each={SLOTS}>
              {() => (
                <div class="yogs-cell time">
                  <Skeleton class={block} />
                </div>
              )}
            </For>
          </div>
          <For each={DAYS}>
            {() => (
              <div class="day-container flex flex-col">
                <div class="yogs-cell day">
                  <Skeleton class={block} />
                </div>
                {/* Not `.time`: its width is the time column's (one unit) */}
                <For each={SLOTS}>
                  {() => (
                    <div class="yogs-cell w-full" style={{ height: 'var(--yogs-slot)' }}>
                      <Skeleton class={block} />
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
    <div class="mobile-schedule mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Skeleton class="rounded-tile h-24 w-full bg-white/20" />
      <div class="grid grid-cols-2 gap-2">
        <Skeleton class="h-10 rounded-full bg-white/20" />
        <Skeleton class="h-10 rounded-full bg-white/20" />
      </div>
      <For each={ROWS}>
        {() => (
          <div class="flex gap-2">
            <div class="w-11 shrink-0" />
            <Skeleton class="rounded-tile h-24 flex-1 bg-white/20" />
          </div>
        )}
      </For>
    </div>
  </div>
)

import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  on,
  onCleanup,
  Show,
} from 'solid-js'
import { cn } from '../../../ui/cn'
import type { Currency } from '../overview/Common.tsx'
import { BG_PRESETS, type BgPreset } from '../donationMatches/presets.ts'
import {
  formatAmount,
  type GoalItem,
  type GoalOrder,
  pageCount,
  pageOf,
  type ShowCount,
} from '../goals/goalItems.ts'
import { itemBackgroundClass } from '../goals/itemBackground.ts'

export type IncentivesOverlayProps = {
  theme: BgPreset
  currency: Currency
  order: GoalOrder
  show: ShowCount
  itemBg: boolean
  title: string
  /** Sorted lowest first. */
  items: GoalItem[]
}

const PAGE_MS = 8_000

/** A static list of donation incentives; more than `show` of them rotate page by page. */
export const IncentivesOverlay: Component<IncentivesOverlayProps> = (props) => {
  const preset = () => BG_PRESETS[props.theme]
  const ordered = createMemo(() =>
    props.order === 'desc' ? [...props.items].reverse() : props.items,
  )
  const pages = () => pageCount(ordered().length, props.show)

  const [page, setPage] = createSignal(0)
  createEffect(
    on(pages, (count) => {
      setPage(0)
      if (count < 2) return
      const timer = setInterval(() => setPage((p) => (p + 1) % count), PAGE_MS)
      onCleanup(() => clearInterval(timer))
    }),
  )

  // Keyed by page, so each page fades in afresh
  const current = createMemo(() => ({
    page: page(),
    items: pageOf(ordered(), props.show, page()),
  }))

  return (
    <div
      class={cn('flex min-h-screen w-full flex-col gap-3 p-4', preset().text)}
      style={{ background: preset().background }}
    >
      <Show when={props.title}>
        <p class="text-center text-3xl font-bold">{props.title}</p>
      </Show>
      <Show
        when={props.items.length > 0}
        fallback={
          <p class="text-center text-lg opacity-80">No incentives set</p>
        }
      >
        <Show when={current()} keyed>
          {(c) => (
            <ul class="motion-safe:animate-fade-in flex flex-col gap-2">
              <For each={c.items}>
                {(item) => (
                  <li
                    class={cn(
                      'flex items-baseline gap-3 text-lg',
                      props.itemBg && itemBackgroundClass(props.theme),
                    )}
                  >
                    <span class="shrink-0 font-bold tabular-nums">
                      {formatAmount(item.value, props.currency)}
                    </span>
                    <span class="min-w-0 wrap-break-word">{item.text}</span>
                  </li>
                )}
              </For>
            </ul>
          )}
        </Show>
        <Show when={pages() > 1}>
          <div class="mt-auto flex justify-center gap-1.5" aria-hidden="true">
            <Index each={Array.from({ length: pages() })}>
              {(_, i) => (
                <span
                  class={cn(
                    'size-2 rounded-full bg-current transition-opacity duration-300',
                    i === page() ? 'opacity-100' : 'opacity-40',
                  )}
                />
              )}
            </Index>
          </div>
        </Show>
      </Show>
    </div>
  )
}

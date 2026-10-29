import {
  type Component,
  createEffect,
  createSignal,
  For,
  on,
  Show,
} from 'solid-js'
import { FaSolidArrowLeftLong, FaSolidArrowRightLong } from 'solid-icons/fa'
import {
  CharityItem,
  CharityItemClosed,
  morphStyle,
  OverviewComponent,
  OverviewComponentClosed,
} from './CharityOverview.tsx'
import { useCharityOverview } from './CharityOverviewProvider.tsx'
import { Button } from '../../ui/Button'

/** Style for the page column next to the desktop sidebar, so it slides along when the sidebar morphs. */
export const sidebarNeighbour = morphStyle('charity-main')

/**
 * Desktop sidebar: the charities and the event totals, collapsible to a narrow column.
 * Opening and closing run as a view transition: each tile, logo, name and amount carries a
 * view-transition-name (CharityOverview.tsx), so the browser morphs every charity between the wide row
 * and the compact card, and the page column (`charity-main`, set by the page) slides along. The timing
 * is in global.css. Without View Transitions support or with reduced motion the layout switches at once.
 */
export const CommunityCharitiesOverview: Component = () => {
  const { mergedCharityItems, overview, charityOpen } = useCharityOverview()
  // The layout on screen; follows charityOpen() inside the view transition.
  const [shownOpen, setShownOpen] = createSignal(charityOpen())

  createEffect(
    on(
      charityOpen,
      (open) => {
        const reduce = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches
        if (reduce || !('startViewTransition' in document)) {
          setShownOpen(open)
          return
        }
        document.startViewTransition(() => setShownOpen(open))
      },
      { defer: true },
    ),
  )

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div
        class="flex flex-col items-stretch gap-2"
        classList={{ 'w-64': shownOpen(), 'w-24': !shownOpen() }}
      >
        <Toggle />
        <Show when={overview.data}>
          {(ov) => (
            <Show
              when={shownOpen()}
              fallback={<OverviewComponentClosed overview={ov()} morph />}
            >
              <OverviewComponent overview={ov()} morph />
            </Show>
          )}
        </Show>
        <For each={mergedCharityItems()}>
          {(it, index) => (
            <Show
              when={shownOpen()}
              fallback={<CharityItemClosed item={it} morph={index()} />}
            >
              <CharityItem item={it} morph={index()} />
            </Show>
          )}
        </For>
      </div>
    </Show>
  )
}

// Mobile: the totals, then every charity; no collapse.
export const CommunityCharitiesOverviewMobile: Component = () => {
  const { mergedCharityItems, overview } = useCharityOverview()

  return (
    <Show when={mergedCharityItems().length > 0}>
      <section class="flex w-full flex-col gap-2" aria-label="Charities">
        <h2 class="text-on-canvas text-lg font-semibold">Charities</h2>
        <Show when={overview.data}>
          {(ov) => <OverviewComponent overview={ov()} />}
        </Show>
        <div class="grid w-full grid-cols-1 items-start gap-2 sm:grid-cols-2">
          <For each={mergedCharityItems()}>
            {(it) => <CharityItem item={it} />}
          </For>
        </div>
      </section>
    </Show>
  )
}

const Toggle: Component = () => {
  const { charityOpen, setCharityOpen } = useCharityOverview()
  return (
    <span class="self-start" style={morphStyle('charity-toggle')}>
      <Button
        size="sm"
        variant="canvas"
        aria-expanded={charityOpen()}
        aria-label={
          charityOpen()
            ? 'Collapse charities overview'
            : 'Expand charities overview'
        }
        onClick={() => setCharityOpen(!charityOpen())}
      >
        <Show
          when={charityOpen()}
          fallback={
            <>
              <FaSolidArrowRightLong class="size-3" aria-hidden="true" /> Open
            </>
          }
        >
          <FaSolidArrowLeftLong class="size-3" aria-hidden="true" /> Close
        </Show>
      </Button>
    </span>
  )
}

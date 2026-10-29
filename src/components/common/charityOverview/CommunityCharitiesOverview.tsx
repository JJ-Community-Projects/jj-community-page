import {
  type Component,
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
} from 'solid-js'
import { FaSolidArrowLeftLong, FaSolidArrowRightLong } from 'solid-icons/fa'
import {
  CharityItem,
  CharityItemClosed,
  OverviewComponent,
  OverviewComponentClosed,
} from './CharityOverview.tsx'
import { useCharityOverview } from './CharityOverviewProvider.tsx'
import { Button } from '../../ui/Button'

// Sidebar toggle in three steps, so the wide and the narrow layout never show at the wrong width:
// fade the items out, swap the layout and resize the column while they are hidden, fade them back in.
const FADE_MS = 150
const RESIZE_MS = 250

/** Desktop sidebar: the charities and the event totals, collapsible to a narrow column. */
export const CommunityCharitiesOverview: Component = () => {
  const { mergedCharityItems, overview, charityOpen } = useCharityOverview()
  // The layout on screen; follows charityOpen() once the items are faded out.
  const [shownOpen, setShownOpen] = createSignal(charityOpen())
  const [visible, setVisible] = createSignal(true)
  let timer: ReturnType<typeof setTimeout> | undefined

  createEffect(
    on(
      charityOpen,
      (open) => {
        clearTimeout(timer)
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setShownOpen(open)
          setVisible(true)
          return
        }
        setVisible(false)
        timer = setTimeout(() => {
          setShownOpen(open)
          timer = setTimeout(() => setVisible(true), RESIZE_MS)
        }, FADE_MS)
      },
      { defer: true },
    ),
  )
  onCleanup(() => clearTimeout(timer))

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div
        class="flex flex-col items-stretch gap-2 transition-[width] duration-250 ease-in-out motion-reduce:transition-none"
        classList={{ 'w-64': shownOpen(), 'w-24': !shownOpen() }}
      >
        <Toggle />
        <div
          class="flex flex-col items-stretch gap-2 transition-opacity duration-150 ease-out motion-reduce:transition-none"
          classList={{ 'opacity-0': !visible() }}
        >
          <Show when={overview.data}>
            {(ov) => (
              <Show
                when={shownOpen()}
                fallback={<OverviewComponentClosed overview={ov()} />}
              >
                <OverviewComponent overview={ov()} />
              </Show>
            )}
          </Show>
          <For each={mergedCharityItems()}>
            {(it) => (
              <Show
                when={shownOpen()}
                fallback={<CharityItemClosed item={it} />}
              >
                <CharityItem item={it} />
              </Show>
            )}
          </For>
        </div>
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
    <Button
      size="sm"
      variant="canvas"
      class="self-start"
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
  )
}

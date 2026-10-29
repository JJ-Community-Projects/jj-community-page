import { type Component, For, Show } from 'solid-js'
import { FaSolidArrowLeftLong, FaSolidArrowRightLong } from 'solid-icons/fa'
import {
  CharityItem,
  CharityItemClosed,
  OverviewComponent,
  OverviewComponentClosed,
} from './CharityOverview.tsx'
import { useCharityOverview } from './CharityOverviewProvider.tsx'
import { Button } from '../../ui/Button'

/** Desktop sidebar: the charities and the event totals, collapsible to a narrow column. */
export const CommunityCharitiesOverview: Component = () => {
  const { mergedCharityItems, overview, charityOpen } = useCharityOverview()

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div
        class="flex flex-col items-stretch gap-2 transition-[width] duration-300 ease-out motion-reduce:transition-none"
        classList={{ 'w-64': charityOpen(), 'w-24': !charityOpen() }}
      >
        <Toggle />
        <Show when={overview.data}>
          {(ov) => (
            <Show
              when={charityOpen()}
              fallback={<OverviewComponentClosed overview={ov()} />}
            >
              <OverviewComponent overview={ov()} />
            </Show>
          )}
        </Show>
        <For each={mergedCharityItems()}>
          {(it) => (
            <Show
              when={charityOpen()}
              fallback={<CharityItemClosed item={it} />}
            >
              <CharityItem item={it} />
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

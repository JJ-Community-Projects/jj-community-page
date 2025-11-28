import { type Component, For, Show } from 'solid-js'
import './CommunityCharitiesOverview.css'
import { FaSolidArrowLeftLong, FaSolidArrowRightLong } from 'solid-icons/fa'
import {
  CharityItem,
  CharityItemClosed,
  OverviewComponent,
  OverviewComponentClosed,
} from './CharityOverview.tsx'
import { useCharityOverview } from './CharityOverviewProvider.tsx' // Top-level subcomponents (do not define components inside other components)

export const CommunityCharitiesOverview: Component = () => {
  const { mergedCharityItems, overview, charityOpen } =
    useCharityOverview()

  const containerWidth = () => (charityOpen() ? 'w-[280px]' : 'w-[96px]')

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div
        class={`flex flex-col items-stretch justify-start gap-2 ${containerWidth()}`}
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

// Mobile-only simplified charities overview: shows the overview at the top
// and then a list/grid of CharityItem components. No toggle/collapse.
export const CommunityCharitiesOverviewMobile: Component = () => {
  const { mergedCharityItems, overview } = useCharityOverview()

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div class={'flex w-full flex-col items-stretch justify-start gap-2'}>
        <Show when={overview.data}>
          {(ov) => <OverviewComponent overview={ov()} />}
        </Show>
        <div class={'grid w-full grid-cols-1 gap-2 sm:grid-cols-2'}>
          <For each={mergedCharityItems()}>
            {(it) => <CharityItem item={it} />}
          </For>
        </div>
      </div>
    </Show>
  )
}

const Toggle: Component = () => {
  const { charityOpen, setCharityOpen } = useCharityOverview()
  return (
    <div class={'flex items-start justify-start'}>
      <p class={'sr-only'}>Charities Overview</p>
      <button
        type="button"
        aria-label={
          charityOpen()
            ? 'Collapse charities overview'
            : 'Expand charities overview'
        }
        class={
          'flex flex-row items-start justify-center gap-2 rounded-lg bg-gradient-to-b from-neutral-50 to-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 shadow ring-1 ring-black/5 transition hover:brightness-105'
        }
        onClick={() => setCharityOpen(!charityOpen())}
      >
        <Show when={charityOpen()} fallback={<FaSolidArrowRightLong />}>
          <FaSolidArrowLeftLong />
        </Show>
        <Show when={charityOpen()} fallback={<p>Open</p>}>
          <p>Close</p>
        </Show>
      </button>
    </div>
  )
}

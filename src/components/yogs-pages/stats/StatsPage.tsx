import { type Component, createSignal, For, onCleanup, Show } from 'solid-js'
import Stats2025 from '../../../stats/2025.json'
import Stats2024 from '../../../stats/2024.json'
import Stats2023 from '../../../stats/2023.json'
import Stats2022 from '../../../stats/2022.json'
import Stats2021 from '../../../stats/2021.json'
import Stats2020 from '../../../stats/2020.json'
import All from '../../../stats/all.json'
import { type Stats } from '../../../lib/model/Stats.ts'
import type { FullCreator } from '../../../lib/model/ContentTypes.ts'
import { CreatorProvider } from '../../features/stats/provider/CreatorProvider.tsx'
import { StreamStats } from '../../features/stats/graphs/StreamStats.tsx'
import { CreatorStats } from '../../features/stats/graphs/CreatorStats.tsx'
import { Accordion, AccordionItem } from '../../ui/Accordion'
import { Tile } from '../../ui/Tile'

interface StreamStatsProps {
  creatorMap: { [key: string]: FullCreator }
}

const years: { key: string; title: string; stats: Stats }[] = [
  { key: 'all', title: '2020–2025', stats: All },
  { key: '2025', title: '2025', stats: Stats2025 },
  { key: '2024', title: '2024', stats: Stats2024 },
  { key: '2023', title: '2023', stats: Stats2023 },
  { key: '2022', title: '2022', stats: Stats2022 },
  { key: '2021', title: '2021', stats: Stats2021 },
  { key: '2020', title: '2020', stats: Stats2020 },
]

export const StatsPageRoot: Component<StreamStatsProps> = (props) => {
  const [expandedItem, setExpandedItem] = createSignal<string[]>([])
  // Charts mount only from md up; the page is client:only, so window is there
  const wide = window.matchMedia('(min-width: 768px)')
  const [isWide, setIsWide] = createSignal(wide.matches)
  const onChange = (event: MediaQueryListEvent) => setIsWide(event.matches)
  wide.addEventListener('change', onChange)
  onCleanup(() => wide.removeEventListener('change', onChange))

  return (
    <CreatorProvider creatorMap={props.creatorMap}>
      <Accordion
        collapsible
        value={expandedItem()}
        onChange={setExpandedItem}
        class="flex w-full flex-col gap-2"
      >
        <For each={years}>
          {(year) => (
            <AccordionItem value={year.key} title={year.title}>
              <Tile class="flex flex-col gap-4">
                <YearSummary stats={year.stats} />
                <Show
                  when={isWide()}
                  fallback={
                    <p class="text-fg-muted text-sm">
                      The charts need a wider screen.
                    </p>
                  }
                >
                  <div class="flex flex-col gap-6">
                    <StreamStats stats={year.stats} />
                    <CreatorStats stats={year.stats} />
                  </div>
                </Show>
              </Tile>
            </AccordionItem>
          )}
        </For>
      </Accordion>
      <div class="text-on-canvas-muted mt-4 flex flex-col items-center gap-1 text-center text-sm">
        <p>
          Some of the statistics regarding appearance might not be accurate.
        </p>
        <p>
          Some donation statistics for late streams might not be accurate as
          they may not take overrun stream time into account.
        </p>
        <a
          class="text-on-canvas font-medium underline"
          href="https://docs.google.com/spreadsheets/d/11Ua2EVlmLCtMKSwKDHnLI8jGvkgJV8BMMHZ1sWowRn0/edit?gid=528381217#gid=528381217"
          target="_blank"
        >
          Jingle Jam Donation Tracker
        </a>
      </div>
    </CreatorProvider>
  )
}

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})
const count = new Intl.NumberFormat('en-GB')

/** The year's totals from the stream list: the whole view on mobile, a summary above the charts. */
const YearSummary: Component<{ stats: Stats }> = (props) => {
  const sum = (key: 'total' | 'donations' | 'minutes') =>
    props.stats.streams.reduce((acc, stream) => acc + stream[key], 0)
  const items = () => [
    { label: 'Raised during streams', value: gbp.format(sum('total')) },
    { label: 'Streams', value: count.format(props.stats.streams.length) },
    {
      label: 'Hours streamed',
      value: count.format(Math.round(sum('minutes') / 60)),
    },
    { label: 'Donations', value: count.format(sum('donations')) },
  ]
  return (
    <dl class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <For each={items()}>
        {(item) => (
          <div class="rounded-group bg-surface-strong ring-line px-3 py-2 ring-1">
            <dt class="text-fg-muted text-xs">{item.label}</dt>
            <dd class="text-raised text-lg font-bold tabular-nums">
              {item.value}
            </dd>
          </div>
        )}
      </For>
    </dl>
  )
}

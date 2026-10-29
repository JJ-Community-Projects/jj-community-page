import { type Component, createSignal, For, Show } from 'solid-js'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { logCreator } from '../../../lib/analytics.ts'
import { Tile } from '../../ui/Tile'
import { Accordion, AccordionItem } from '../../ui/Accordion'
import { DateDivider } from '../../ui/Labels'
import { YogsCreatorChip } from './YogsCreatorChip.tsx'
import { YogsCreatorDialog } from './YogsCreatorDialog.tsx'

interface YogsAndFriendsProps {
  creators: YogsCreator[]
}

/**
 * "Yogs & Friends": every creator of a schedule as a chip, grouped like before (Yogs and staff by
 * name, Best of, Friends), in one collapsible panel (closed by default). One island for all of them
 * and one creator dialog for the selected one.
 */
export const YogsAndFriends: Component<YogsAndFriendsProps> = (props) => {
  const yogs = () =>
    props.creators
      .filter((creator) => creator.type === 'yogs' || creator.type === 'staff')
      .sort((a, b) => a.name.localeCompare(b.name))
  const bestOf = () =>
    props.creators.filter((creator) => creator.type === 'best_of')
  const friends = () =>
    props.creators.filter((creator) => creator.type === 'friend')

  const [selected, setSelected] = createSignal<YogsCreator>()
  const modal = createModalSignal()
  const open = (creator: YogsCreator) => {
    setSelected(creator)
    modal.open()
    logCreator(creator)
  }

  return (
    <Show when={props.creators.length > 0}>
      {/* Collapsed by default; forceMount keeps the names in the server HTML while closed */}
      {/* As wide as the schedule: the timeline's max-w-2xl, then the grid's cap (yogs-schedule.css) */}
      <Accordion collapsible class="w-full max-w-2xl min-[901px]:max-w-[min(80vw,1600px)]">
        <AccordionItem value="yogs-and-friends" title="Yogs & Friends" level={2} forceMount>
          <Tile class="flex flex-col gap-4">
            <CreatorGroup title="Yogs" creators={yogs()} onOpen={open} />
            <CreatorGroup title="Best of" creators={bestOf()} onOpen={open} />
            <CreatorGroup title="Friends" creators={friends()} onOpen={open} />
          </Tile>
        </AccordionItem>
      </Accordion>
      <Show when={selected()}>
        {(creator) => <YogsCreatorDialog creator={creator()} modalSignal={modal} />}
      </Show>
    </Show>
  )
}

const CreatorGroup: Component<{
  title: string
  creators: YogsCreator[]
  onOpen: (creator: YogsCreator) => void
}> = (props) => (
  <Show when={props.creators.length > 0}>
    <section class="flex flex-col gap-2">
      <DateDivider tone="tile">{props.title}</DateDivider>
      {/* At least 11rem per chip, so names like "The Longest Johns" fit */}
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
        <For each={props.creators}>
          {(creator) => (
            <YogsCreatorChip
              creator={creator}
              class="w-full"
              onClick={() => props.onOpen(creator)}
            />
          )}
        </For>
      </div>
    </section>
  </Show>
)

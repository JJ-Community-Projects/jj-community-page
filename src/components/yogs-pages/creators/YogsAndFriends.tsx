import { type Component, createSignal, For, Show } from 'solid-js'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { logCreator } from '../../../lib/analytics.ts'
import { Tile } from '../../ui/Tile'
import { Accordion, AccordionItem } from '../../ui/Accordion'
import { useYogsSchedule } from '../schedule/provider/YogsScheduleProvider.tsx'
import { useCreatorFilter } from '../schedule/provider/CreatorFilterProvider.tsx'
import { YogsCreatorChip } from './YogsCreatorChip.tsx'
import { YogsCreatorDialog } from './YogsCreatorDialog.tsx'

interface YogsAndFriendsProps {
  creators: YogsCreator[]
}

/**
 * "Yogs & Friends": every creator of a schedule as a chip, sorted by name, in one collapsible panel
 * (closed by default). One island for all of them and one creator dialog for the selected one.
 */
export const YogsAndFriends: Component<YogsAndFriendsProps> = (props) => {
  const { getCreatorStreams } = useYogsSchedule()
  const { reset, addFilter } = useCreatorFilter()
  const creators = () =>
    [...props.creators].sort((a, b) => a.name.localeCompare(b.name))

  const [selected, setSelected] = createSignal<YogsCreator>()
  const modal = createModalSignal()
  const open = (creator: YogsCreator) => {
    setSelected(creator)
    modal.open()
    logCreator(creator)
  }

  // Filters the schedule to the creator and scrolls back up to it (the panel sits below the schedule)
  const showStreams = (creator: YogsCreator) => {
    reset()
    addFilter(creator.id)
    modal.close()
    const schedule = [
      ...document.querySelectorAll<HTMLElement>('.desktop-schedule .yogs-grid, .mobile-schedule'),
    ].find((el) => el.getClientRects().length > 0)
    schedule?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Show when={props.creators.length > 0}>
      {/* Collapsed by default; forceMount keeps the names in the server HTML while closed */}
      {/* As wide as the schedule: the timeline's max-w-2xl, then the grid's cap (yogs-schedule.css) */}
      <Accordion collapsible class="w-full max-w-2xl min-[901px]:max-w-[min(80vw,1600px)]">
        <AccordionItem value="yogs-and-friends" title="Yogs & Friends" level={2} forceMount>
          <Tile>
            {/* At least 11rem per chip, so names like "The Longest Johns" fit */}
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              <For each={creators()}>
                {(creator) => (
                  <YogsCreatorChip
                    creator={creator}
                    class="w-full"
                    onClick={() => open(creator)}
                  />
                )}
              </For>
            </div>
          </Tile>
        </AccordionItem>
      </Accordion>
      <Show when={selected()}>
        {(creator) => {
          const count = () => getCreatorStreams(creator().id).length
          return (
            <YogsCreatorDialog
              creator={creator()}
              modalSignal={modal}
              streamCount={count()}
              onJJStreamsClick={count() > 0 ? () => showStreams(creator()) : undefined}
            />
          )
        }}
      </Show>
    </Show>
  )
}

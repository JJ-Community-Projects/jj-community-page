import { type Component, For, Show } from 'solid-js'
import { YogsCreatorPill } from './YogsCreatorPill.tsx'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'

interface YogsCreatorPillsProps {
  creators: YogsCreator[]
}

/** "Yogs & Friends": every creator of a schedule as a pill (one island for all of them). */
export const YogsCreatorPills: Component<YogsCreatorPillsProps> = (props) => {
  const yogs = () =>
    props.creators.filter(
      (creator) => creator.type === 'yogs' || creator.type === 'staff',
    )
  const bestOf = () =>
    props.creators.filter((creator) => creator.type === 'best_of')
  const friends = () =>
    props.creators.filter((creator) => creator.type === 'friend')

  return (
    <Show when={props.creators.length > 0}>
      <div class="flex flex-col items-center justify-center gap-2 p-4">
        <h2 class="text-center text-2xl text-white">Yogs & Friends</h2>
        <div class="flex flex-col items-center gap-2">
          <CreatorGroup title="Yogs" creators={yogs()} />
          <CreatorGroup title="Best Of" creators={bestOf()} />
          <CreatorGroup title="Friends" creators={friends()} />
        </div>
      </div>
    </Show>
  )
}

const CreatorGroup: Component<{ title: string; creators: YogsCreator[] }> = (
  props,
) => (
  <Show when={props.creators.length > 0}>
    <h3 class="mb-1 text-xl text-white">{props.title}</h3>
    <div class="flex flex-wrap items-center justify-center gap-2">
      <For each={props.creators}>
        {(creator) => <YogsCreatorPill creator={creator} />}
      </For>
    </div>
  </Show>
)

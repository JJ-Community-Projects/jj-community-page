import { type Component, For } from 'solid-js'
import { FaSolidPlay } from 'solid-icons/fa'
import type { Stream } from '../../../../lib/orpc/public/schemas/schedules'
import { UpcomingStreamRow } from '../../schedules/common/StreamCard'
import { Section } from '../../../ui/Tile'

/** The team's next streams (the page only renders this when there are some). */
export const TeamNextStreamsSection: Component<{ streams: Stream[] }> = (
  props,
) => (
  <Section title="Upcoming Streams" icon={<FaSolidPlay />}>
    <div class="grid gap-2 sm:grid-cols-2">
      <For each={props.streams}>
        {(stream) => <UpcomingStreamRow stream={stream} />}
      </For>
    </div>
  </Section>
)

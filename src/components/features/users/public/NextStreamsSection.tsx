import { type Component, For } from 'solid-js'
import { FaSolidPlay } from 'solid-icons/fa'
import type {
  ScheduleInfo,
  Stream,
} from '../../../../lib/orpc/public/schemas/schedules'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { UpcomingStreamRow } from '../../schedules/common/StreamCard'
import { Button } from '../../../ui/Button'
import { Section } from '../../../ui/Tile'

interface StreamsPreviewProps {
  streams: Stream[]
  primarySchedule: ScheduleInfo
  user: UserDisplay
}

/** The next streams of the user's primary schedule (the page only renders this when there are some). */
export const NextStreamsSection: Component<StreamsPreviewProps> = (props) => (
  <Section
    title="Upcoming Streams"
    icon={<FaSolidPlay />}
    action={
      <Button
        href={`/schedules/${props.primarySchedule.slug}`}
        size="sm"
        variant="accent"
      >
        View Full Schedule
      </Button>
    }
  >
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <For each={props.streams}>
        {(stream) => <UpcomingStreamRow stream={stream} user={props.user} />}
      </For>
    </div>
  </Section>
)

import { type Component, For, Show } from 'solid-js'
import type {
  ScheduleInfo,
  Stream,
} from '../../../../lib/orpc/public/schemas/schedules'
import { ScheduleStreamCard } from '../../schedules/common/StreamCard'
import { FaSolidCalendarDays, FaSolidPlay } from 'solid-icons/fa'

interface StreamsPreviewProps {
  streams: Stream[]
  primarySchedule: ScheduleInfo
  userColors: {
    primaryColor: string | null
    accentColor: string | null
  }
}

export const NextStreamsSection: Component<StreamsPreviewProps> = (props) => {
  // Get user colors with fallbacks to design system colors
  const primaryColor = props.userColors.primaryColor || '#E30E50'
  const accentColor = props.userColors.accentColor || '#3584BF'

  return (
    <div
      class="group/next-stream w-full rounded-xl border-2 bg-white shadow-md transition-all duration-300 group-hover:border-accent-200 hover:shadow-lg"
      style={{
        '--user-primary': primaryColor,
        '--user-accent': accentColor,
      }}
    >
      <div class="p-4">
        <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidPlay class="h-5 w-5 text-black transition-all duration-300 group-hover/next-stream:text-accent" />
          <h2 class="font-babas text-black transition-all duration-300 ~text-xl/2xl group-hover/next-stream:text-accent">
            Upcoming Streams
          </h2>
        </div>

        <Show
          when={props.streams && props.streams.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <FaSolidCalendarDays class="mb-6 h-10 w-10 text-black" />
              <h3 class="mb-2 font-poppins text-lg font-semibold text-neutral-700">
                No upcoming streams
              </h3>
              <p class="font-poppins text-neutral-500">
                Streams will appear here when scheduled in your primary schedule
              </p>
            </div>
          }
        >
          <div class="flex flex-wrap items-center justify-center gap-4">
            <For each={props.streams}>
              {(stream) => (
                <div
                  class="w-1/4 transform transition-all duration-200"
                  style={{
                    '--stream-accent': accentColor,
                  }}
                >
                  <ScheduleStreamCard
                    stream={stream}
                    type="top-bar"
                    hover={true}
                  />
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Call to action for more streams */}
        <Show when={props.streams && props.streams.length > 0}>
          <div class="mt-6 border-t border-gray-100 pt-6 text-center">
            <a
              href={`/schedules/${props.primarySchedule.slug}`}
              class="transform rounded-lg border-2 bg-accent px-6 py-2 font-poppins font-medium text-white transition-all duration-200 hover:bg-accent-600"
            >
              View Full Schedule
            </a>
          </div>
        </Show>
      </div>
    </div>
  )
}

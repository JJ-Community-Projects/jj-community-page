import { type Component, For, Show } from 'solid-js'
import type { ScheduleInfo, Stream } from '../../../../lib/orpc/public/schemas/schedules'
import { ScheduleStreamCard } from '../../schedules/common/StreamCard'
import { FaSolidCalendarDays, FaSolidPlay } from 'solid-icons/fa'

interface StreamsPreviewProps {
  streams: Stream[];
  primarySchedule: ScheduleInfo
  userColors: {
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export const NextStreamsSection: Component<StreamsPreviewProps> = (props) => {
  // Get user colors with fallbacks to design system colors
  const primaryColor = props.userColors.primaryColor || '#E30E50';
  const accentColor = props.userColors.accentColor || '#3584BF';

  return (
    <div
      class="group/next-stream w-full bg-white rounded-xl shadow-md border-2 group-hover:border-accent-200 hover:shadow-lg transition-all duration-300"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
      <div class="p-4">
          <div class="flex items-center gap-2 text-lg font-semibold mb-4">
            <FaSolidPlay class="w-5 h-5 text-black group-hover/next-stream:text-accent transition-all duration-300" />
            <h2 class="~text-xl/2xl font-babas text-black group-hover/next-stream:text-accent transition-all duration-300">
              Upcoming Streams
            </h2>
          </div>

        <Show
          when={props.streams && props.streams.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <FaSolidCalendarDays class="w-10 h-10 text-black mb-6" />
              <h3 class="text-lg font-semibold text-neutral-700 mb-2 font-poppins">No upcoming streams</h3>
              <p class="text-neutral-500 font-poppins">
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
                    "--stream-accent": accentColor
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
          <div class="mt-6 pt-6 border-t border-gray-100 text-center">
            <a
              href={`/schedules/${props.primarySchedule.slug}`}
              class="bg-accent/15 border-accent/30 text-accent hover:bg-accent hover:text-white border-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 font-poppins"
            >
              View Full Schedule
            </a>
          </div>
        </Show>
      </div>
    </div>
  );
};

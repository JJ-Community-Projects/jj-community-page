import {type Component, For, Show} from "solid-js";
import type {ScheduleInfo, Stream} from "../../../../lib/orpc/public/schemas/schedules";
import {ScheduleStreamCard} from "../../schedules/common/StreamCard";
import {FaSolidCalendarDays, FaSolidPlay} from "solid-icons/fa";

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
      class="bg-white rounded-xl shadow-md border-2 border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6"
      style={{
        "--user-primary": primaryColor,
        "--user-accent": accentColor
      }}
    >
      <div class="p-4 md:p-6 lg:p-8">
        <div class="flex flex-col items-center text-center mb-6">
          <div class="flex items-center gap-3 mb-2">
            <FaSolidPlay class="w-5 h-5 text-black" />
            <h2 class="~text-xl/2xl font-babas text-black">
              Upcoming Streams
            </h2>
          </div>
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <For each={props.streams}>
              {(stream) => (
                <div
                  class="transform hover:scale-[1.02] transition-all duration-200"
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
              class="px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 font-poppins"
              style={{
                "background-color": `${accentColor}15`,
                "color": accentColor,
                "border": `2px solid ${accentColor}30`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${accentColor}15`;
                e.currentTarget.style.color = accentColor;
              }}
            >
              View Full Schedule
            </a>
          </div>
        </Show>
      </div>
    </div>
  );
};

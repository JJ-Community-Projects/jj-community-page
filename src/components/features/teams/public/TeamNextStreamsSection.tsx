import {type Component, For, Show} from "solid-js";
import type {Stream} from "../../../../lib/orpc/public/schemas/schedules";
import {ScheduleStreamCard} from "../../schedules/common/StreamCard";
import {FaSolidCalendarDays, FaSolidPlay} from "solid-icons/fa";

interface TeamNextStreamsSectionProps {
  streams: Stream[];
  teamSlug: string;
  teamColors?: {
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export const TeamNextStreamsSection: Component<TeamNextStreamsSectionProps> = (props) => {
  const {streams, teamSlug, teamColors} = props;

  // Get team colors with fallbacks to design system colors
  const primaryColor = teamColors?.primaryColor || '#E30E50';
  const accentColor = teamColors?.accentColor || '#3584BF';

  return (
    <div
      class="bg-white rounded-xl shadow-md border-2 border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6"
      style={{
        "--team-primary": primaryColor,
        "--team-accent": accentColor
      }}
    >
      <div class="p-4 md:p-6 lg:p-8">
        {/* Section Header */}
        <div class="flex flex-col items-center text-center mb-6">
          <div class="flex items-center gap-3 mb-2">
            <FaSolidPlay class="w-5 h-5 text-black" />
            <h2 class="~text-xl/2xl font-babas text-black">
              Upcoming Team Streams
            </h2>
          </div>
        </div>

        <Show
          when={streams && streams.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg"
                style={{
                  "background": `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                }}
              >
                <FaSolidCalendarDays class="w-8 h-8 text-white" />
              </div>
              <h3 class="text-lg font-semibold text-neutral-700 mb-2 font-poppins">No upcoming streams</h3>
              <p class="text-neutral-500 font-poppins">
                Team member streams will appear here when scheduled
              </p>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <For each={streams}>
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
        <Show when={streams && streams.length > 0}>
          <div class="mt-6 pt-6 border-t border-gray-100 text-center">
            <a
              href={`/teams/${teamSlug}/schedules/2024`}
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
              View All Team Schedules
            </a>
          </div>
        </Show>
      </div>
    </div>
  );
};

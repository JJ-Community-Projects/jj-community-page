import { type Component, Show } from 'solid-js'
import { FaSolidChevronLeft, FaSolidTriangleExclamation } from 'solid-icons/fa'
import type { Schedule } from '../../../../../lib/orpc/private/schemas/schedules.ts'
import { useSchedule } from '../teams/useSchedule.ts'
import { useNow } from '../../../../../lib/utils/useNow.ts'

/**
 * ScheduleHeader Component
 *
 * Header section for schedule management displaying navigation, title, and actions.
 * Extracted from SchedulesList to improve modularity and maintainability.
 *
 * Features:
 * - Navigation back to dashboard
 * - Schedule list title and add schedule action
 * - Informational description about schedule management
 * - Modern design with consistent styling
 * - Responsive design with proper spacing
 * - Comprehensive accessibility support
 *
 * Props:
 * - onAddSchedule: Callback function triggered when "Add Schedule" button is clicked
 */

interface ScheduleHeaderProps {
  onAddSchedule: () => void
  schedules: Schedule[]
}

export const ScheduleHeader: Component<ScheduleHeaderProps> = (props) => {
  const {
    hasPrimarySchedule,
    hasVisibleSchedule,
    hasVisiblePrimaryForCurrentYear,
    isAfterNovFirstThisYear,
    hasInvisibleStreamsInVisibleSchedule,
  } = useSchedule()
  const now = useNow()

  return (
    <div class="rounded-xl border-2 bg-white p-6 shadow-md duration-300">
      <div class="flex flex-col gap-4">
        {/* Navigation - User ownership semantic (primary colors) */}
        <a
          href={`/dashboard`}
          class="flex items-center gap-2 rounded-md font-medium text-primary transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <FaSolidChevronLeft class="h-4 w-4" />
          <span>Back to Dashboard</span>
        </a>

        <div class="flex items-center justify-between">
          <h2 class="font-bold text-gray-800 ~text-xl/2xl">Your Schedules</h2>

          {/* Add Schedule button - Discovery/Add action semantic (accent colors) */}
          <button
            class="transform rounded-lg bg-accent px-4 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => props.onAddSchedule()}
          >
            Add Schedule
          </button>
        </div>

        {/* Light warning if no primary schedule is set */}
        <Show when={props.schedules.length > 0 && !hasPrimarySchedule()}>
          <div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <FaSolidTriangleExclamation
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p class="leading-relaxed ~text-sm/base">
              You haven't set a primary schedule yet. Your page will not
              highlight a schedule until you set one. Use the star button on a
              schedule to mark it as your primary.
            </p>
          </div>
        </Show>

        {/* Warning when some streams in the visible primary schedule are hidden */}
        <Show when={hasInvisibleStreamsInVisibleSchedule()}>
          <div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <FaSolidTriangleExclamation
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p class="leading-relaxed ~text-sm/base">
              Some streams in your public schedule are hidden. Set those streams to Visible so they appear on your page.
            </p>
          </div>
        </Show>

        {/* Light warning if no schedules are visible/public */}
        <Show when={props.schedules.length > 0 && !hasVisibleSchedule()}>
          <div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <FaSolidTriangleExclamation
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p class="leading-relaxed ~text-sm/base">
              None of your schedules are public yet. Your page won't show a
              schedule until you make one visible. Use the eye button on a
              schedule to toggle its visibility to Public.
            </p>
          </div>
        </Show>

        {/* Light warning after Nov 1 if no visible primary schedule exists for the current year */}
        <Show
          when={
            props.schedules.length > 0 &&
            isAfterNovFirstThisYear() &&
            !hasVisiblePrimaryForCurrentYear()
          }
        >
          <div class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
            <FaSolidTriangleExclamation
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
              aria-hidden="true"
            />
            <p class="leading-relaxed ~text-sm/base">
              You don't have a public primary schedule for {now().year}. Set one of your {now().year }{' '}
              schedules as Primary and make it Public to feature it.
            </p>
          </div>
        </Show>

        <p class="leading-relaxed text-gray-600 ~text-sm/base">
          You can create up to 3 schedules per year. Only one can be set as your
          primary schedule for that year. In most cases, you'll only need one
          per year. Your primary schedule will be highlighted on your page,
          while any other schedules—whether from the same year or different
          years—will still be available to view from your page.
        </p>
      </div>
    </div>
  )
}

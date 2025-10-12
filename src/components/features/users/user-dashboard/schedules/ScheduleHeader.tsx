import { type Component } from 'solid-js'
import { FaSolidChevronLeft } from 'solid-icons/fa'

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
  onAddSchedule: () => void;
}

export const ScheduleHeader: Component<ScheduleHeaderProps> = (props) => {
  return (
    <div class="bg-white rounded-xl p-6 shadow-md border-2 duration-300">
      <div class="flex flex-col gap-4">
        {/* Navigation - User ownership semantic (primary colors) */}
        <a
          href={`/dashboard`}
          class="text-primary hover:text-primary-600 flex items-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
        >
          <FaSolidChevronLeft class="w-4 h-4" />
          <span>Back to Dashboard</span>
        </a>

        <div class="flex justify-between items-center">
          <h2 class="~text-xl/2xl font-bold text-gray-800">Your Schedules</h2>

          {/* Add Schedule button - Discovery/Add action semantic (accent colors) */}
          <button
            class="
              px-4 py-2 bg-accent text-white rounded-lg font-medium
              hover:bg-accent-600 shadow-sm hover:shadow-md
              focus:ring-2 focus:ring-accent focus:ring-offset-2
              transition-all duration-200 transform active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            onClick={() => props.onAddSchedule()}
          >
            Add Schedule
          </button>
        </div>

        <p class="~text-sm/base text-gray-600 leading-relaxed">
          You can create up to 3 schedules per year. Only one can be set as your primary schedule for that year. In
          most cases, you'll only need one per year. Your primary schedule will be highlighted on your page, while any
          other schedules—whether from the same year or different years—will still be available to view from your page.
        </p>
      </div>
    </div>
  );
};

import { type Component, Show } from 'solid-js'
import type { Schedule } from '../../../../../lib/orpc/private/schemas/schedules.ts'
import { useSchedule } from '../teams/useSchedule.ts'
import { useNow } from '../../../../../lib/utils/useNow.ts'
import { PageHeader } from '../../../../ui/PageHeader'
import { Button } from '../../../../ui/Button'
import { Alert } from '../../../../ui/Status'

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
    <div class="flex flex-col gap-3">
      <PageHeader
        title="Your Schedules"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
        actions={
          <Button variant="accent" onClick={() => props.onAddSchedule()}>
            Add Schedule
          </Button>
        }
      />
      {/* Light warning if no primary schedule is set */}
      <Show when={props.schedules.length > 0 && !hasPrimarySchedule()}>
        <Alert tone="warning">
          You haven't set a primary schedule yet. Your page will not highlight a
          schedule until you set one. Use the star button on a schedule to mark
          it as your primary.
        </Alert>
      </Show>

      {/* Warning when some streams in the visible primary schedule are hidden */}
      <Show when={hasInvisibleStreamsInVisibleSchedule()}>
        <Alert tone="warning">
          All streams in your public primary schedule are hidden. Set those
          streams to Visible so they appear on your page.
        </Alert>
      </Show>

      {/* Light warning if no schedules are visible/public */}
      <Show when={props.schedules.length > 0 && !hasVisibleSchedule()}>
        <Alert tone="warning">
          None of your schedules are public yet. Your page won't show a schedule
          until you make one visible. Use the eye button on a schedule to toggle
          its visibility to Public.
        </Alert>
      </Show>

      {/* Light warning after Nov 1 if no visible primary schedule exists for the current year */}
      <Show
        when={
          props.schedules.length > 0 &&
          isAfterNovFirstThisYear() &&
          !hasVisiblePrimaryForCurrentYear()
        }
      >
        <Alert tone="danger">
          You don't have a public primary schedule for {now().year}. Set one of
          your {now().year} schedules as Primary and make it Public to feature
          it.
        </Alert>
      </Show>

      <p class="text-on-canvas-muted text-sm leading-relaxed">
        You can create up to 3 schedules per year. Only one can be set as your
        primary schedule for that year. In most cases, you'll only need one per
        year. Your primary schedule will be highlighted on your page, while any
        other schedules—whether from the same year or different years—will still
        be available to view from your page.
      </p>
    </div>
  )
}

import {createContext, createResource, type ParentComponent, useContext} from "solid-js";
import {actions} from "astro:actions";

/**
 * Custom hook for fetching and managing schedule data
 * @param tiltifyUsername - The Tiltify username to fetch schedule data for
 * @returns Object containing schedule data and layout information
 */
const useScheduleHook = (tiltifyUsername: string) => {
  // Fetch schedule data using createResource
  const [data, {refetch}] = createResource(async () => {
    const {data, error} = await actions.ui.user.schedules.byTiltifyName(tiltifyUsername)
    if (error) {
      throw error;
    }
    return data
  })

  /**
   * Determines the appropriate layout type based on schedule statistics
   *
   * Layout types:
   * - 'list': A wrapping list best for schedules with few streams or few days
   * - 'week': Best for schedules with at least 5 days in one week with at least 2 streams each
   * - 'collapsible-days': Best for schedules with many streams but with less than 5 days
   * - 'none': When no schedule data is available
   *
   * @returns The determined layout type as a string
   */
  const layout = (): string => {
    const d = data()
    if (!d) return 'none'
    const stats = d.stats

    // Check if we have enough data to make a decision
    if (stats.numberOfSteams === 0 || stats.daysWithStreams === 0) {
      return 'none'
    }

    // Check for 'week' layout - at least 5 days with at least 2 streams each
    const hasEnoughDaysInWeek = stats.daysWithStreams >= 5
    const hasMultipleStreamsPerDay = stats.minStreamsInDay >= 2

    if (hasEnoughDaysInWeek && hasMultipleStreamsPerDay) {
      return 'week'
    }

    // Check for 'collapsible-days' layout - many streams but fewer than 5 days
    const hasManyStreams = stats.numberOfSteams > 5
    const hasFewDays = stats.daysWithStreams < 5

    if (hasManyStreams && hasFewDays) {
      return 'collapsible-days'
    }

    // Default to 'list' layout for schedules with few streams or few days
    return 'list'
  }

  return {data, layout}
}

interface ScheduleProps {
  tiltifyUsername: string
}

const ScheduleContext = createContext<ReturnType<typeof useScheduleHook>>();

export const ScheduleProvider: ParentComponent<ScheduleProps> = (props) => {
  const hook = useScheduleHook(props.tiltifyUsername)
  return (
    <ScheduleContext.Provider value={hook}>
      {props.children}
    </ScheduleContext.Provider>
  );
}
export const useSchedule = () => useContext(ScheduleContext);

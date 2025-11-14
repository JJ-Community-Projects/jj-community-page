import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { DateTime } from 'luxon'
import { useNow } from '../../../../../lib/utils/useNow.ts'

export const useSchedule = () => {
  const now = useNow()

  // Query for user schedules
  const schedulesQuery = useQuery(() =>
    orpcPrivate.schedules.getSchedules.queryOptions({
      staleTime: 30 * 1000, // 30 seconds
    }),
  )
  const schedules = () => schedulesQuery.data ?? []

  const scheduleCount = () => schedules().length

  const hasSchedules = () => scheduleCount() > 0

  const hasPrimarySchedule = () =>
    schedules().some((schedule) => schedule.primary)
  const hasVisibleSchedule = () =>
    schedules().some((schedule) => schedule.visible)
  const hasVisiblePrimaryForCurrentYear = () =>
    schedules().some(
      (schedule) =>
        schedule.primary && schedule.visible && schedule.year === now().year,
    )
  const isAfterNovFirstThisYear = () => {
    const d = now()
    const novFirst = DateTime.fromObject({
      year: now().year,
      month: 11,
      day: 1,
    })
    return d >= novFirst
  }



  const showWarning = () =>{
    if (!hasSchedules()){
      return false
    }
    return !hasPrimarySchedule() || !hasVisibleSchedule() || !hasVisiblePrimaryForCurrentYear() || !isAfterNovFirstThisYear()
  }


  return {
    schedules: () => schedulesQuery.data ?? [],
    schedulesQuery,
    hasPrimarySchedule,
    hasVisibleSchedule,
    hasVisiblePrimaryForCurrentYear,
    isAfterNovFirstThisYear,
    showWarning,
  }
}

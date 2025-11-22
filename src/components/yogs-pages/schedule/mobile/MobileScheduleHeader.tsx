import { type Component, Show } from 'solid-js'
import { DateTime } from 'luxon'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'
import { createModalSignal } from '../../../../lib/createModalSignal.ts'
import { useCreatorFilter } from '../provider/CreatorFilterProvider.tsx'
import { FaSolidChevronLeft, FaSolidChevronRight } from 'solid-icons/fa'
import { BiRegularReset } from 'solid-icons/bi'
import { CalendarDialog } from '../provider/ScheduleCalendarExportButton.tsx'
import { FilterDialog } from '../provider/ScheduleCreatorFilterButton.tsx'

interface MobileScheduleHeaderProps {}

export const MobileScheduleHeader: Component<MobileScheduleHeaderProps> = (
  props,
) => {
  return (
    <div class={'schedule-header flex flex-col gap-2'}>
      <MobileTitle />
    </div>
  )
}
const MobileTitle: Component = () => {
  const { schedule, day } = useYogsSchedule()

  const start = () => {
    const d = day()
    const range = rangeFromData(d.streams)
    if (range) {
      return range.start
    }
    return d.start
  }

  return (
    <div class={'p-schedule'}>
      <div
        class={
          'flex flex-col items-center justify-center rounded-2xl bg-white shadow-xl'
        }
      >
        <h3 class={'text-2xl'}>{schedule.title}</h3>
        <p class={'text-day-header flex-1 text-center text-base'}>
          {DateTime.fromJSDate(start()).toFormat("EEE',' MMM d")}
        </p>
      </div>
    </div>
  )
}

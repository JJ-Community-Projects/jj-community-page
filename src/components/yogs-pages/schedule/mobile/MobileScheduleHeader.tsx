import { type Component } from 'solid-js'
import { useYogsSchedule } from '../provider/YogsScheduleProvider.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'

export const MobileScheduleHeader: Component = () => {
  return (
    <div class={'flex flex-col gap-2'}>
      <MobileTitle />
    </div>
  )
}
const MobileTitle: Component = () => {
  const { schedule, day, toDateTime } = useYogsSchedule()

  const start = () => {
    const d = day()
    const range = rangeFromData(d.streams)
    if (range) {
      return range.start
    }
    return d.start
  }

  return (
    <div
      class={
        'flex flex-col items-center justify-center rounded-2xl bg-white shadow-xl'
      }
    >
      <h3 class={'text-2xl'}>{schedule.title}</h3>
      <p class={'flex-1 text-center text-base'}>
        {toDateTime(start()).toFormat("EEE',' MMM d")}
      </p>
    </div>
  )
}

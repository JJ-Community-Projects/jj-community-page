import { type Component } from 'solid-js'
import type { YogsSchedule } from '../../../../lib/orpc/private/yogs/contract.ts'
import { StreamPlaceholder } from './StreamPlaceholder.tsx'

interface PlaceholderScheduleProps {
  schedule: YogsSchedule
}

export const PlaceholderSchedule: Component<PlaceholderScheduleProps> = (
  props,
) => {
  const schedule = props.schedule
  const week = schedule.weeks[0]
  return (
    <div class={'flex flex-col blur'}>
      <div class={'data-height flex w-full flex-row'}>
        <div class={'data-height data-width'} />
        <div class={'header-title-card-width p-2'}>
          <div
            class={
              'flex h-full w-full flex-row items-center justify-center rounded-2xl bg-white'
            }
          ></div>
        </div>
        <div class={'stream-width data-height flex flex-row justify-end'}>
          <div
            class={
              'flex h-full w-full flex-row items-end justify-end gap-2 p-2'
            }
          ></div>
        </div>
        <div class={'stream-width p-2'}>
          <div
            class={
              'flex h-full w-full flex-1 flex-col items-center justify-center rounded-2xl bg-white'
            }
          >
            <div
              class={'flex w-full flex-row items-center justify-around'}
            ></div>
          </div>
        </div>

        <div class={'stream-width p-2'}>
          <div
            class={
              'flex h-full w-full flex-1 flex-col items-center justify-center rounded-2xl bg-white'
            }
          >
            <div
              class={'flex w-full flex-row items-center justify-around'}
            ></div>
          </div>
        </div>

        <div class={'stream-width p-2'}>
          <div
            class={'flex h-full w-full flex-row items-center justify-center'}
          >
            <div
              class={
                'flex h-full flex-1 flex-col items-center justify-center rounded-l-2xl bg-white'
              }
            ></div>
            <div
              class={
                'flex h-full flex-1 flex-col items-center justify-center rounded-r-2xl bg-white'
              }
            ></div>
          </div>
        </div>
      </div>

      <div class={'flex flex-row'}>
        <div class="data-width flex flex-col text-sm">
          <div class="timezone p-1">
            <p class="flex h-full w-full flex-row items-center justify-center rounded-2xl bg-white" />
          </div>
          {schedule!.times.map((time) => (
            <div class="time p-1">
              <div class="flex h-full w-full flex-col items-center justify-around rounded-2xl bg-white p-1" />
            </div>
          ))}
        </div>

        <div class="flex flex-row">
          {week.days.map((day) => {
            return (
              <div class="day-container flex flex-col">
                <div class={'day p-1'}>
                  <div
                    class={
                      'flex h-full w-full flex-row items-center justify-center rounded-2xl bg-white'
                    }
                  />
                </div>

                {day.streams.map((stream) => {
                  return <StreamPlaceholder stream={stream} />
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

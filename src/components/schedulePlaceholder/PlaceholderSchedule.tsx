import {type Component} from "solid-js";
import type {FullSchedule} from "../../lib/model/ContentTypes.ts";
import {StreamPlaceholder} from "./StreamPlaceholder.tsx";

interface PlaceholderScheduleProps {
  schedule: FullSchedule
}

export const PlaceholderSchedule: Component<PlaceholderScheduleProps> = (props) => {
  const schedule = props.schedule
  const week = schedule.weeks[0]
  return (

    <div class={'flex flex-col blur'}>
      <div class={'data-height w-full flex flex-row'}>
        <div class={'data-height data-width'}/>
        <div class={'p-2 header-title-card-width'}>
          <div class={'w-full h-full bg-white rounded-2xl flex flex-row justify-center items-center'}>
          </div>
        </div>
        <div class={'stream-width flex flex-row justify-end data-height'}>
          <div class={'p-2 w-full h-full flex flex-row justify-end items-end gap-2'}>
          </div>
        </div>
        <div class={'p-2 stream-width'}>
          <div
            class={
              'w-full h-full bg-white flex flex-1 flex-col items-center justify-center rounded-2xl'
            }
          >
            <div class={'flex w-full flex-row items-center justify-around'}>
            </div>
          </div>
        </div>

        <div class={'p-2 stream-width'}>
          <div
            class={
              'w-full h-full bg-white flex flex-1 flex-col items-center justify-center rounded-2xl'
            }
          >
            <div class={'flex w-full flex-row items-center justify-around'}>
            </div>
          </div>
        </div>


        <div class={'p-2 stream-width'}>
          <div class={'w-full h-full flex flex-row justify-center items-center'}>
            <div
              class={
                'bg-white flex flex-1 flex-col items-center justify-center rounded-l-2xl h-full'
              }
            >
            </div>
            <div
              class={
                'bg-white flex flex-1 flex-col items-center justify-center rounded-r-2xl h-full'
              }
            >
            </div>
          </div>
        </div>
      </div>


      <div class={'flex flex-row'}>
        <div class="data-width flex flex-col text-sm">
          <div class="timezone p-1">
            <p class="w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center"/>
          </div>
          {
            schedule!.times.map((time) => (
              <div class="time p-1">
                <div class="w-full h-full flex flex-col justify-around items-center bg-white rounded-2xl p-1"/>
              </div>
            ))
          }
        </div>


        <div class="flex flex-row">
          {
            week.days.map(day => {

              return (
                <div class="day-container flex flex-col">

                  <div class={'day p-1'}>
                    <div class={'w-full h-full bg-white rounded-2xl flex flex-row items-center justify-center'}/>
                  </div>

                  {
                    day.streams.map(stream => {
                      return (
                        <StreamPlaceholder stream={stream}/>
                      )
                    })
                  }
                </div>
              )
            })
          }
        </div>
      </div>

    </div>
  );
}

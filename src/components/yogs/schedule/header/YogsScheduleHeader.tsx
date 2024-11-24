import {type Component} from "solid-js";
import {useYogsSchedule} from "../provider/YogsScheduleProvider.tsx";
import {FilterDialog, FilterResetButton, FilterShareButton} from "../provider/ScheduleCreatorFilterButton.tsx";
import {createModalSignal} from "../../../../lib/createModalSignal.ts";
import {BsPeopleFill} from "solid-icons/bs";
import {FaRegularCalendar, FaSolidChevronLeft, FaSolidChevronRight} from "solid-icons/fa";
import {CalendarDialog} from "../provider/ScheduleCalendarExportButton.tsx";
import {Tooltip} from "@kobalte/core";

export const YogsScheduleHeader: Component = () => {
  const {schedule, nextWeek, prevWeek} = useYogsSchedule()
  const filterModal = createModalSignal()
  const calenderModal = createModalSignal()

  return (
    <div class={'data-height w-full flex flex-row'}>
      <div class={'data-height data-width'}/>
      <div class={'p-1 header-title-card-width'}>
        <div class={'w-full h-full bg-white rounded-2xl flex flex-row justify-center items-center'}>
          <p class={'text-center text-xl xl:text-3xl'}>{schedule.title}</p>
        </div>
      </div>
      <div class={'stream-width flex flex-row justify-end data-height'}>
        <div class={'p-1 w-full h-full flex flex-row justify-end items-end gap-2'}>
          <FilterShareButton/>
          <FilterResetButton/>
        </div>
      </div>
      <div class={'p-1 stream-width'}>
        <button
          class={
            'w-full h-full bg-accent text-white flex flex-1 flex-col items-center justify-center rounded-2xl transition-all hover:scale-105 hover:brightness-105'
          }
          onClick={filterModal.open}
        >
          <div class={'flex w-full flex-row items-center justify-around'}>
            <p>Filter</p>
            <BsPeopleFill/>
          </div>
        </button>
        <FilterDialog modalSignal={filterModal}/>
      </div>

      <div class={'p-1 stream-width'}>
        <button
          class={
            'w-full h-full text-white bg-accent-500 hover:brightness-105 flex flex-1 flex-col items-center justify-center rounded-2xl transition-all hover:scale-105'
          }
          onClick={calenderModal.open}
        >
          <div class={'flex w-full flex-row items-center justify-around'}>
            <p>Export</p> <FaRegularCalendar/>
          </div>
        </button>
        <CalendarDialog modalSignal={calenderModal}/>
      </div>


      <div class={'p-1 stream-width'}>
        <div class={'w-full h-full flex flex-row justify-center items-center'}>
          <Tooltip.Root openDelay={300} closeDelay={300}>
            <Tooltip.Trigger
              class={
                'bg-accent-500 text-white hover:brightness-105 ripple flex flex-1 flex-col items-center justify-center rounded-l-2xl transition-all hover:scale-105 h-full'
              }
              onClick={prevWeek}
            >
              <FaSolidChevronLeft />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content class={'bg-accent rounded p-2 text-white'}>
                <Tooltip.Arrow />
                <p>Previous Week</p>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root openDelay={300} closeDelay={300}>
            <Tooltip.Trigger
              class={
                'bg-accent-500 text-white hover:brightness-105 ripple flex flex-1 flex-col items-center justify-center rounded-r-2xl transition-all hover:scale-105 h-full'
              }
              onClick={nextWeek}
            >
              <FaSolidChevronRight />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content class={'bg-accent rounded p-2 text-white'}>
                <Tooltip.Arrow />
                <p>Next Week</p>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
    </div>
  );
}

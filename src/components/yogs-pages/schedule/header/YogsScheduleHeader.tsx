import {type Component, Show} from "solid-js";
import {useYogsSchedule} from "../provider/YogsScheduleProvider.tsx";
import {FilterDialog, FilterResetButton, FilterShareButton} from "../provider/ScheduleCreatorFilterButton.tsx";
import {useCreatorFilter} from "../provider/CreatorFilterProvider.tsx";
import {createModalSignal} from "../../../../lib/createModalSignal.ts";
import {BsPeopleFill} from "solid-icons/bs";
import {FaRegularCalendar, FaSolidChevronLeft, FaSolidChevronRight} from "solid-icons/fa";
import {CalendarDialog} from "../provider/ScheduleCalendarExportButton.tsx";
import {Button, IconButton} from "../../../ui/Button";
import {cn, tileSurface} from "../../../ui/cn";

// Controls fill their grid cell; the system font, not the grid's Bebas
const control = 'size-full rounded-tile font-sans shadow-tile xl:text-base'
const iconControl = 'size-auto h-full aspect-square rounded-tile font-sans'

/** The poster's header row: title card over three days, then share/reset, Filter, Export and the week switch. */
export const YogsScheduleHeader: Component = () => {
  const {schedule, nextWeek, prevWeek, weekIndex, numberOfWeeks} = useYogsSchedule()
  const {isEmpty, filter} = useCreatorFilter()
  const filterModal = createModalSignal()
  const calendarModal = createModalSignal()

  const week = () => weekIndex() + 1

  return (
    <div class={'data-height flex w-full flex-row'}>
      <div class={'data-width'}/>
      <div class={'yogs-cell header-title-card-width h-full @container'}>
        <div class={cn(tileSurface, 'flex size-full items-center justify-center')}>
          <p class={'text-center text-[length:clamp(1.25rem,6.5cqi,2.5rem)] leading-none'}>
            {schedule.title} | Week {week()}
          </p>
        </div>
      </div>
      <div class={'yogs-cell stream-width flex h-full flex-row justify-end gap-(--yogs-gap)'}>
        <FilterShareButton class={iconControl}/>
        <FilterResetButton class={iconControl}/>
      </div>
      <div class={'yogs-cell stream-width h-full'}>
        <Button
          variant={isEmpty() ? 'canvas' : 'accent'}
          class={control}
          aria-haspopup="dialog"
          onClick={filterModal.open}
        >
          <BsPeopleFill class={'size-4'}/>
          Filter
          <Show when={!isEmpty()}>
            <span class={'tabular-nums'}>· {filter().length}</span>
          </Show>
        </Button>
        <FilterDialog modalSignal={filterModal}/>
      </div>
      <div class={'yogs-cell stream-width h-full'}>
        <Button variant="canvas" class={control} aria-haspopup="dialog" onClick={calendarModal.open}>
          <FaRegularCalendar class={'size-4'}/>
          Export
        </Button>
        <CalendarDialog modalSignal={calendarModal}/>
      </div>
      <div class={'yogs-cell stream-width h-full'}>
        <div class={'flex size-full items-center justify-between rounded-tile bg-white px-1 font-sans text-fg shadow-tile'}>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Previous week"
            title="Previous week"
            disabled={numberOfWeeks() < 2}
            onClick={prevWeek}
          >
            <FaSolidChevronLeft/>
          </IconButton>
          <span class={'text-sm font-semibold whitespace-nowrap tabular-nums xl:text-base'}>
            <span class={'max-xl:sr-only'}>Week </span>{week()}/{numberOfWeeks()}
          </span>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Next week"
            title="Next week"
            disabled={numberOfWeeks() < 2}
            onClick={nextWeek}
          >
            <FaSolidChevronRight/>
          </IconButton>
        </div>
      </div>
    </div>
  );
}

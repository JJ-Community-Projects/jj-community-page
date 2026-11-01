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
import {ScheduleSettingsMenu} from "./ScheduleSettingsMenu.tsx";
import {ScheduleFullscreenButton} from "./ScheduleFullscreenButton.tsx";

// Controls fill their grid cell; the system font, not the grid's Bebas
const control = 'size-full rounded-tile font-sans shadow-tile xl:text-base'
const iconControl = 'size-auto h-full aspect-square rounded-tile font-sans'

/** The poster's header row: settings over the time column, title card (with the Yogs time) over three days, then share/reset, Filter, Export, the week switch and full screen. */
export const YogsScheduleHeader: Component = () => {
  const {schedule, nextWeek, prevWeek, weekIndex, numberOfWeeks, yogsTime} = useYogsSchedule()
  const {isEmpty, filter} = useCreatorFilter()
  const filterModal = createModalSignal()
  const calendarModal = createModalSignal()

  const week = () => weekIndex() + 1

  return (
    <div class={'yogs-header data-height flex w-full flex-row'}>
      <div class={'yogs-cell data-width h-full'}>
        <ScheduleSettingsMenu class={'size-full'}/>
      </div>
      <div class={'yogs-cell header-title-card-width h-full'}>
        <div class={cn(tileSurface, 'flex size-full items-center justify-between gap-3 px-3')}>
          <p class={'min-w-0 text-balance text-(length:--yogs-header-text) leading-none'}>
            {schedule.title} | Week {week()}
          </p>
          <p class={'flex shrink-0 flex-col items-end leading-none'} title="Current time in London">
            <span class={'text-fg-muted text-(length:--yogs-header-label-text)'}>Yogs time</span>
            <span class={'tabular-nums text-(length:--yogs-header-time-text)'}>{yogsTime()}</span>
          </p>
        </div>
      </div>
      <div class={'yogs-cell stream-width flex h-full flex-row justify-end gap-(--yogs-gap)'}>
        <FilterShareButton class={iconControl} expand/>
        <FilterResetButton class={iconControl} expand/>
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
      <div class={'yogs-cell stream-width flex h-full flex-row gap-(--yogs-gap)'}>
        <div class={'flex h-full min-w-0 flex-1 items-center justify-between rounded-tile bg-white dark:bg-surface-strong px-1 font-sans text-fg shadow-tile'}>
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
            <span class={'sr-only'}>Week </span>{week()}/{numberOfWeeks()}
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
        <ScheduleFullscreenButton class={iconControl}/>
      </div>
    </div>
  );
}

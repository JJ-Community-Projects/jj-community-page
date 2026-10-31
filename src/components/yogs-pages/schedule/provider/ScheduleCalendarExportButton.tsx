import { type Component, createSignal, For } from 'solid-js'
import { DateTime, Duration } from 'luxon'
import ical, { ICalAlarmType } from 'ical-generator'
import { type ModalSignal } from '../../../../lib/createModalSignal.ts'
import { useCreatorFilter } from './CreatorFilterProvider.tsx'
import { useYogsSchedule } from './YogsScheduleProvider.tsx'
import { rangeFromData } from '../../../../lib/utils/rangeFromData.ts'
import type { YogsStream } from '../../../../lib/orpc/private/yogs/contract.ts'
import { log } from '../../../../lib/analytics.ts'
import { Dialog } from '../../../ui/Dialog'
import { Button } from '../../../ui/Button'
import { SearchField } from '../../../ui/Form'
import { Alert } from '../../../ui/Status'
import { DateDivider } from '../../../ui/Labels'
import { TileGroup } from '../../../ui/Tile'
import { cn, focusRing } from '../../../ui/cn'
import { CheckMark } from './ScheduleCreatorFilterButton.tsx'

interface CalendarDialogDialogProps {
  modalSignal: ModalSignal
}

/**
 * Pick streams and download them as one .ics file. The list takes the creator filter into account;
 * the file (events, ids, name) is the same as before the redesign.
 */
export const CalendarDialog: Component<CalendarDialogDialogProps> = props => {
  const {schedule, streams, days} = useYogsSchedule()
  const {filteredStreams, isSlotPartOfFilter, isEmpty} = useCreatorFilter()
  const [selectedSlots, setSelectedSlots] = createSignal<YogsStream[]>([])
  const [search, setSearch] = createSignal('')

  const download = () => {
    const s = icalString()
    const range = rangeFromData(schedule.streams)
    if (range) {
      const start = DateTime.fromJSDate(range.start)
      downloadFile(`MyJJSchedule${start.year}.ics`, s)
    } else {
      downloadFile(`MyJJSchedule${DateTime.now().year}.ics`, s)
    }
    log('export_schedule', {
      schedule: schedule.title,
    })
  }

  const downloadFile = (filename: string, text: string) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/calendar;charset=utf8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  const includes = (slot: YogsStream) => {
    return selectedSlots().find(s => s.start == slot.start) !== undefined
  }
  const toggle = (slot: YogsStream) => {
    if (includes(slot)) {
      setSelectedSlots([...selectedSlots().filter(s => s.start != slot.start)])
    } else {
      setSelectedSlots([...selectedSlots(), slot])
    }
  }

  const icalString = () => {
    const calendar = ical({name: 'My JJ Schedule'})
    for (const slot of selectedSlots()) {
      const start = DateTime.fromJSDate(slot.start)
      const end = DateTime.fromJSDate(slot.end)
      calendar.createEvent({
        id: `jjstream${start.year}${start.year}_${start.month}_${start.day}_${start.hour}_${start.minute}`,
        url: 'https://twitch.tv/yogscast',
        start: start,
        end: end,
        summary: `Jingle Jam ${start.year} - ${slot.title}`,
        alarms: [
          {
            type: ICalAlarmType.display,
            triggerBefore: start.minus(Duration.fromObject({minutes: 15})),
          },
        ],
      })
    }
    return calendar.toString()
  }

  const isInSearch = (slot: YogsStream) => {
    if (!isSlotPartOfFilter(slot)) {
      return false
    }
    if (search() == '') {
      return true
    }
    const names = slot.creators?.map(c => c.name) ?? []
    return (
      slot.title.toLowerCase().includes(search().toLowerCase()) ||
      names.some(n => n.toLowerCase().includes(search().toLowerCase()))
    )
  }

  // Select all / Deselect all stay one toggle, as before
  const allSelected = () => selectedSlots().length === filteredStreams().length
  const toggleAll = () =>
    allSelected() ? setSelectedSlots([]) : setSelectedSlots(streams().filter(isInSearch))

  // Only rendered while open, so after mount: the viewer's offset
  const offset = () => DateTime.fromJSDate(schedule.streams[0]?.start ?? new Date()).offsetNameShort

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title="Export to calendar"
      description={`Pick streams, download one .ics file · times in ${offset()}`}
      footer={
        <>
          <p class="text-fg-muted mr-auto self-center text-sm tabular-nums" aria-live="polite">
            {selectedSlots().length} selected
          </p>
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {allSelected() ? 'Deselect all' : 'Select all'}
          </Button>
          <Button variant="primary" size="sm" disabled={selectedSlots().length == 0} onClick={download}>
            Download .ics
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3">
        <Alert class="text-xs">
          {isEmpty()
            ? `All ${filteredStreams().length} streams. Set a creator filter to narrow the list. `
            : `Uses your creator filter (${filteredStreams().length} streams). `}
          <a
            class="font-semibold underline"
            href="https://support.google.com/calendar/answer/37118?co=GENIE.Platform%3DDesktop"
            target="_blank"
            rel="noopener noreferrer"
          >
            How to import an .ics into Google Calendar
          </a>
        </Alert>
        <div class="bg-surface-strong sticky -top-3 z-10 -mx-4 px-4 py-1">
          <SearchField
            label="Search streams or creators"
            placeholder="Search streams or creators"
            value={search()}
            onInput={setSearch}
          />
        </div>
        <For
          each={days().filter(day => day.streams.some(isInSearch))}
          fallback={<p class="text-fg-muted py-6 text-center text-sm">No stream matches “{search()}”.</p>}
        >
          {day => {
            const start = DateTime.fromJSDate(rangeFromData(day.streams)?.start ?? day.start)
            return (
              <section class="flex flex-col gap-1.5">
                <DateDivider tone="tile">{start.toFormat('EEE d MMM')}</DateDivider>
                <TileGroup pad="none" class="divide-line flex flex-col divide-y overflow-hidden">
                  <For each={day.streams.filter(isInSearch)}>
                    {slot => (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={includes(slot)}
                        class={cn(
                          'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-tint focus-visible:-outline-offset-2',
                          focusRing,
                        )}
                        onClick={() => toggle(slot)}
                      >
                        <span
                          class="h-5 w-1 shrink-0 rounded-full bg-(--stream-color)"
                          style={{'--stream-color': slot.color}}
                          aria-hidden="true"
                        />
                        <span class="min-w-0 flex-1 truncate font-medium">{slot.title}</span>
                        <span class="text-fg-muted text-xs tabular-nums">
                          {DateTime.fromJSDate(slot.start).toLocaleString(DateTime.TIME_SIMPLE)}
                        </span>
                        <CheckMark checked={includes(slot)}/>
                      </button>
                    )}
                  </For>
                </TileGroup>
              </section>
            )
          }}
        </For>
      </div>
    </Dialog>
  )
}

import {type Component, createSignal, For, Show} from 'solid-js'
import {Dialog} from '@kobalte/core'
import {CgClose, CgInfo} from 'solid-icons/cg'
import {FaRegularCalendar, FaRegularSquare, FaSolidSquareCheck} from 'solid-icons/fa'
import {DateTime, Duration} from 'luxon'
import ical, {ICalAlarmType} from 'ical-generator'
import {createModalSignal, type ModalSignal} from "../../../../lib/createModalSignal.ts";
import {useCreatorFilter} from "./CreatorFilterProvider.tsx";
import {useYogsSchedule} from "./YogsScheduleProvider.tsx";
import {rangeFromData} from "../../../../lib/utils/rangeFromData.ts";
import type {FullStream} from "../../../../lib/model/ContentTypes.ts";


export const CalendarExportButton: Component = () => {
  const modalSignal = createModalSignal()

  return (
    <>
      <div class={'w-slot h-data p-schedule'}>
        <div class={'schedule-card-white flex flex-row'}>
          <button
            class={
              'hover:bg-accent-50 flex flex-1 flex-col items-center justify-center rounded-2xl transition-all hover:scale-105'
            }
            onclick={modalSignal.open}
          >
            <div class={'flex w-full flex-row items-center justify-around'}>
              <p>Export</p> <FaRegularCalendar/>
            </div>
          </button>
        </div>
      </div>
      <CalendarDialog modalSignal={modalSignal}/>
    </>
  )
}

interface CalendarDialogDialogProps {
  modalSignal: ModalSignal
}

export const CalendarDialog: Component<CalendarDialogDialogProps> = props => {
  const {modalSignal} = props

  return (
    <Dialog.Root open={modalSignal.isOpen()} onOpenChange={modalSignal.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class={'fixed inset-0 z-50 bg-black bg-opacity-20'}/>
        <div class={'fixed inset-0 z-50 flex items-center justify-center'}>
          <Dialog.Content class={'h-full w-full max-w-[500px] p-2 lg:w-[min(calc(100vw_-_16px),_500px)] lg:p-16'}>
            <CalendarDialogDialogBody onClose={modalSignal.close}/>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface CalendarDialogDialogBodyProps {
  onClose: () => void
}

const CalendarDialogDialogBody: Component<CalendarDialogDialogBodyProps> = props => {
  const {onClose} = props
  const {schedule, streams, days} = useYogsSchedule()
  const {filteredStreams, isSlotPartOfFilter} = useCreatorFilter()
  const [selectedSlots, setSelectedSlots] = createSignal<FullStream[]>([])
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

  const includes = (slot: FullStream) => {
    return selectedSlots().find(s => s.start == slot.start) !== undefined
  }
  const toggle = (slot: FullStream) => {
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

  const isInSearch = (slot: FullStream) => {
    if (!isSlotPartOfFilter(slot)) {
      return false
    }
    if (search() == '') {
      return true
    }
    const names = slot.creators.map(c => c.name)
    return (
      slot.title.toLowerCase().includes(search().toLowerCase()) ||
      names.some(n => n.toLowerCase().includes(search().toLowerCase()))
    )
  }
  return (
    <div class={'flex h-full w-full flex-col rounded-3xl bg-white'}>
      <div class={`bg-primary flex h-[72px] items-center justify-center rounded-t-3xl p-2 text-white shadow-xl`}>
        <button onClick={onClose}>
          <CgClose size={24} class={''}/>
        </button>
        <div class={'flex-1'}></div>
        <h3 class={'text-2xl'}>Calendar Export</h3>
        <div class={'flex-1'}></div>
        <div class={'w-[24px]'}></div>
      </div>

      <a
        class={'flex flex-row items-center justify-start gap-1 px-2 py-2 text-sm'}
        href={'https://support.google.com/calendar/answer/37118?co=GENIE.Platform%3DDesktop'}
        target={'_blank'}
      >
        <CgInfo/> How to import an .ics (iCal) file into Google Calendar
      </a>
      <p class={'px-2 py-2'}>Filtered streams: {filteredStreams().length}</p>
      <p class={'px-2 py-2'}>This list of streams takes the creator filter into account</p>
      <div class="p-2">
        <label class="mb-2 block text-sm font-bold text-gray-700" for="search">
          Search
        </label>
        <input
          class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          id="search"
          type="text"
          placeholder="Search"
          value={search()}
          onInput={e => {
            const target = e.target as HTMLInputElement
            if (target) {
              setSearch(target.value)
            }
          }}
        />
      </div>
      <div class={'flex w-full flex-1 flex-col gap-2 overflow-auto p-2'}>
        <For each={days()}>
          {day => {

            const s = () => {
              const range = rangeFromData(day.streams)
              if (range) {
                return DateTime.fromJSDate(range.start)
              }
              return DateTime.fromJSDate(day.date)
            }

            const start = s()
            const slots = day.streams
            const hasSlots = () => slots.some(s => isInSearch(s))
            return (
              <>
                <Show when={hasSlots()}>
                  <>
                    <p>
                      {start.toLocaleString({
                        day: '2-digit',
                        month: 'short',
                        weekday: 'short',
                      })}
                    </p>
                    <For each={day.streams}>
                      {slot => {
                        const start = DateTime.fromJSDate(slot.start)
                        return (
                          <Show when={isInSearch(slot)}>
                            <button
                              class={'hover:bg-accent-50 border-accent-50 rounded-xl border-2 p-4 hover:brightness-105'}
                              onClick={() => toggle(slot)}
                            >
                              <div class={'flex flex-row items-center'}>
                                <p class={'flex-1 text-left'}>
                                  {slot.title} ({start.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET)})
                                </p>
                                <div class={'text-accent-500'}>
                                  <Show when={includes(slot)}>
                                    <FaSolidSquareCheck size={24}/>
                                  </Show>
                                  <Show when={!includes(slot)}>
                                    <FaRegularSquare size={24}/>
                                  </Show>
                                </div>
                              </div>
                            </button>
                          </Show>
                        )
                      }}
                    </For>
                  </>
                </Show>
              </>
            )
          }}
        </For>
      </div>
      <div class={'flex h-[72px] flex-row items-center justify-end gap-2 p-2'}>
        <Show when={selectedSlots().length < filteredStreams().length}>
          <button
            class={'bg-primary rounded-xl p-2 text-white'}
            onclick={() => {
              const filteredSlots = streams().filter(isInSearch)
              setSelectedSlots(filteredSlots)
            }}
          >
            Select All
          </button>
        </Show>
        <Show when={selectedSlots().length === filteredStreams().length}>
          <button
            class={'bg-primary rounded-xl p-2 text-white'}
            onclick={() => {
              setSelectedSlots([])
            }}
          >
            Deselect All
          </button>
        </Show>
        <button
          disabled={selectedSlots().length == 0}
          class={'bg-primary rounded-xl p-2 text-white disabled:bg-gray-500 disabled:opacity-75'}
          onclick={download}
        >
          Download
        </button>
      </div>
    </div>
  )
}

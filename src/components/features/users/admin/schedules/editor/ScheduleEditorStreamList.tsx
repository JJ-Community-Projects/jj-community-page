import {type Component, createMemo, For, Index, Show} from "solid-js";
import {DateTime} from "luxon";
import {debounce} from "@solid-primitives/scheduled";
import {useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {DayCard} from "./DayCard.tsx";
import {DayCardProvider} from "./DayCardContext.tsx";
import {StreamCard} from "./stream/StreamCard.tsx";
import {Accordion} from "@kobalte/core/accordion";
import "./ScheduleEditorAccordion.css";


// Desktop view - 2 rows of 7 days each
export const DesktopStreamsList: Component = () => {
  const {action, getAllDays, local} = useScheduleEditor();


  const visibleWeek1 = createMemo(() => {
    return local.streams.filter((stream) => {
      const s = stream.start
      return s.month === 12 && (s.day >= 1 && s.day <= 7)
    }).reduce((s, x) => {
      if (x.visible) {
        return {
          visible: s.visible + 1,
          invisible: s.invisible,
          total: s.total + 1,
        }
      } else {
        return {
          visible: s.visible,
          invisible: s.invisible + 1,
          total: s.total + 1,
        }
      }
    }, {visible: 0, invisible: 0, total: 0});
  })

  const visibleWeek2 = createMemo(() => {
    return local.streams.filter((stream) => {
      const s = stream.start
      return s.month === 12 && (s.day >= 8 && s.day <= 14)
    }).reduce((s, x) => {
      if (x.visible) {
        return {
          visible: s.visible + 1,
          invisible: s.invisible,
          total: s.total + 1,
        }
      } else {
        return {
          visible: s.visible,
          invisible: s.invisible + 1,
          total: s.total + 1,
        }
      }
    }, {visible: 0, invisible: 0, total: 0})
  })

  const visibleTotal = createMemo(() => {
    return local.streams.reduce((s, x) => {
      if (x.visible) {
        return {
          visible: s.visible + 1,
          invisible: s.invisible,
          total: s.total + 1,
        }
      } else {
        return {
          visible: s.visible,
          invisible: s.invisible + 1,
          total: s.total + 1,
        }
      }
    }, {visible: 0, invisible: 0, total: 0})
  })

  const visibleWeek1Str = createMemo(() => {
    const {visible, total} = visibleWeek1()
    if (visible === total) {
      return `${visible}`
    }
    return `${visible}/${total}`
  })

  const visibleWeek2Str = createMemo(() => {
    const {visible, total} = visibleWeek2()
    if (visible === total) {
      return `${visible}`
    }
    return `${visible}/${total}`
  })

  const visibleTotalStr = createMemo(() => {
    const {visible, invisible, total} = visibleTotal()
    if (visible === total) {
      return `${visible}`
    }
    return `${visible}/${total}`
  })

  return (
    <div>
      <div class="mb-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Schedule Streams</h2>
        <p class="text-gray-600">Manage your streams by week or create custom streams</p>
      </div>

      <Show when={action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start">
          <svg class="h-5 w-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"/>
          </svg>
          <span>{action.addNewStream.lastErrorMessage || action.deleteStream.lastErrorMessage}</span>
        </div>
      </Show>

      <Accordion class="schedule-accordion" defaultValue={["week1"]} collapsible={true}>
        {/* First week (Dec 1-7) */}
        <Accordion.Item class="schedule-accordion__item" value="week1">
          <Accordion.Header class="schedule-accordion__item-header">
            <Accordion.Trigger class="schedule-accordion__item-trigger">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"/>
                </svg>
                <span>December 1-7 ({visibleWeek1Str()})</span>
              </div>
              <svg class="h-5 w-5 schedule-accordion__item-trigger-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"/>
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="schedule-accordion__item-content">
            <Week1/>
          </Accordion.Content>
        </Accordion.Item>

        {/* Second week (Dec 8-14) */}
        <Accordion.Item class="schedule-accordion__item" value="week2">
          <Accordion.Header class="schedule-accordion__item-header">
            <Accordion.Trigger class="schedule-accordion__item-trigger">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"/>
                </svg>
                <span>December 8-14 ({visibleWeek2Str()})</span>
              </div>
              <svg class="h-5 w-5 schedule-accordion__item-trigger-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"/>
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="schedule-accordion__item-content">
            <Week2/>
          </Accordion.Content>
        </Accordion.Item>

        {/* Custom Streams Section */}
        <Accordion.Item class="schedule-accordion__item" value="allStreams">
          <Accordion.Header class="schedule-accordion__item-header">
            <Accordion.Trigger class="schedule-accordion__item-trigger">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
                </svg>
                <span>Custom Streams ({visibleTotalStr()})</span>
              </div>
              <svg class="h-5 w-5 schedule-accordion__item-trigger-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"/>
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="schedule-accordion__item-content">
            <AllStreams/>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

const Week1: Component = () => {
  const {
    addNewStream,
    getAllDays,
    getStreamsByDay,
    action,
  } = useScheduleEditor();

  // Group days into two rows
  const firstWeek = () => getAllDays().slice(0, 7);
  return (
    <div class="grid grid-cols-7 gap-4 mb-6">
      <For each={firstWeek()}>
        {(day, index) => (
          <DayCardProvider
            start={day}
            end={day}
          >
            <DayCard
              dayIndex={index()}
              day={day}
              streams={getStreamsByDay(day.day)}
              onAddStream={() => addNewStream(day.day)}
              isAddingStream={action.addNewStream.actionInProgress}
            />
          </DayCardProvider>
        )}
      </For>
    </div>
  )
}

const Week2: Component = () => {
  const {
    addNewStream,
    getAllDays,
    getStreamsByDay,
    action,
  } = useScheduleEditor();

  const secondWeek = () => getAllDays().slice(7, 14);

  return (
    <div class="grid grid-cols-7 gap-4">
      <For each={secondWeek()}>
        {(day, index) => (
          <DayCardProvider
            start={day}
            end={day}
          >
            <DayCard
              dayIndex={index()}
              day={day}
              streams={getStreamsByDay(day.day)}
              onAddStream={() => addNewStream(day.day)}
              isAddingStream={action.addNewStream.actionInProgress}
            />
          </DayCardProvider>
        )}
      </For>
    </div>
  )
}

const AllStreams: Component = () => {
  const {
    local,
    addCustomStream,
    action,
  } = useScheduleEditor();

  return (
    <div class="pt-2">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">All Streams</h3>
          <p class="text-sm text-gray-600">View and manage all your scheduled streams</p>
        </div>
        <button
          onClick={() => addCustomStream()}
          class="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          disabled={action.addNewStream.actionInProgress}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clip-rule="evenodd"/>
          </svg>
          {action.addNewStream.actionInProgress ? "Adding Stream..." : "Add Custom Stream"}
        </button>
      </div>

      <Show when={local.streams.length === 0}>
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <p class="text-gray-600 mb-2">No streams yet</p>
          <p class="text-sm text-gray-500 mb-6">Create your first stream to get started</p>
          <button
            onClick={() => addCustomStream()}
            class="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clip-rule="evenodd"/>
            </svg>
            Create Stream
          </button>
        </div>
      </Show>

      <Show when={local.streams.length > 0}>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DayCardProvider
            start={DateTime.fromObject({
              year: local.year,
              month: 11,
              day: 1,
            })}
            end={DateTime.fromObject({
              year: local.year,
              month: 12,
              day: 21,
            })}>
            <For each={local.streams}>
              {(stream) => (
                <div
                  class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                  <StreamCard stream={stream} showDate={true} whiteBackground={true}/>
                </div>
              )}
            </For>
          </DayCardProvider>
        </div>
      </Show>
    </div>
  )
}

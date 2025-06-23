import {DateTime} from "luxon";
import type {ModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {type Component, createSignal, Show} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {Accordion} from "@kobalte/core/accordion";
import {TagsSection} from "./TagsSection.tsx";
import {StreamParticipantsSection} from "./StreamParticipantsSection.tsx";
import {useDayCard} from "../DayCardContext.tsx";
import {useStreamEditor} from "./ScheduleEditorStreamEditDialogBodyProvider.tsx";
import "./ScheduleEditorStreamEditDialogBody.css";
import { FaSolidTag, FaSolidUserGroup, FaRegularClock } from "solid-icons/fa";

interface ScheduleEditorStreamEditDialogBodyProps {
  stream: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    youtubeVodUrl?: string;
    twitchVodUrl?: string;
    start: DateTime;
    end: DateTime;
    visible: boolean;
    tags?: { label: string, tag: string }[];
    participants?: { userId: number, providerName: string, provider: string }[];
    createdBy: number;
  };
  editStreamDialog: ModalSignal,
  deleteDialog: ModalSignal,
}

export const ScheduleEditorStreamEditDialogBody: Component<ScheduleEditorStreamEditDialogBodyProps> = (props) => {
  const {action} = useScheduleEditor();

  const {stream, save} = useStreamEditor()

  return (
    <form class="space-y-6" onSubmit={save}>
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4 pb-2 border-b border-gray-200">Stream Details</h3>
        <div class="space-y-4">
          <Title/>
          <Subtitle/>
          <Visibility/>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4 pb-2 border-b border-gray-200">Time Settings</h3>
        <div class="space-y-4">
          <Start/>
          <DurationAndEndSwitch/>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4 pb-2 border-b border-gray-200">Additional Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Accordion class="accordion" collapsible={true}>
            <Accordion.Item class="accordion__item" value="tags-section">
              <Accordion.Header class="accordion__item-header">
                <Accordion.Trigger class="accordion__item-trigger flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all">
                  <div class="flex items-center">
                    <FaSolidTag class="h-5 w-5 mr-2 text-accent" />
                    <span class="font-medium">Tags ({stream.tags.length})</span>
                  </div>
                  <svg class="h-5 w-5 accordion__item-trigger-icon transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content class="accordion__item-content pt-2">
                <TagsSection
                  streamId={stream.id}
                />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>

          <Accordion class="accordion" collapsible={true} >
            <Accordion.Item class="accordion__item" value="participants-section">
              <Accordion.Header class="accordion__item-header">
                <Accordion.Trigger class="accordion__item-trigger flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all">
                  <div class="flex items-center">
                    <FaSolidUserGroup class="h-5 w-5 mr-2 text-accent" />
                    <span class="font-medium">Participants ({stream.participants.length})</span>
                  </div>
                  <svg class="h-5 w-5 accordion__item-trigger-icon transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content class="accordion__item-content pt-2">
                <StreamParticipantsSection
                  streamId={stream.id}
                />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4 pb-2 border-b border-gray-200">Content Information</h3>
        <div class="space-y-4">
          <Description/>
          <Vods/>
        </div>
      </div>

      <Show when={action.saveStream.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {action.saveStream.lastErrorMessage}
        </div>
      </Show>

      <div class="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            props.editStreamDialog.close()
            props.deleteDialog.open()
          }}
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={action.saveStream.actionInProgress}
          type="button"
        >
          Delete
        </button>
        <button
          type="submit"
          class="bg-accent hover:bg-accent-600 text-white px-6 py-2 rounded-lg transition-all shadow-sm hover:shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={action.saveStream.actionInProgress}
        >
          {action.saveStream.actionInProgress ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Display loading indicator when saving */}
      <Show when={action.saveStream.actionInProgress}>
        <div class="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <div class="animate-spin h-10 w-10 border-3 border-accent border-t-transparent rounded-full mb-4"></div>
            <span class="text-lg font-medium">Saving your stream...</span>
          </div>
        </div>
      </Show>
    </form>
  );
}

const Title: Component = () => {
  const {stream, setTitle} = useStreamEditor()
  return (
    <TextField
      name="title"
      class="flex flex-col"
      value={stream.title}
      onChange={setTitle}
    >
      <TextField.Label class="text-sm font-medium mb-1">Title: </TextField.Label>
      <TextField.Input
        class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
      />
    </TextField>
  )
}

const Subtitle: Component = () => {
  const {stream, setSubtitle} = useStreamEditor()
  return (
    <TextField
      name="subtitle"
      class="flex flex-col"
      value={stream.subtitle}
      onChange={setSubtitle}
    >
      <TextField.Label class="text-sm font-medium mb-1">Subtitle: </TextField.Label>
      <TextField.Input
        class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
      />
    </TextField>
  )
}

const Visibility: Component = () => {
  const {stream, setVisible} = useStreamEditor()
  return (
    <Checkbox
      name="visible"
      class="items-center inline-flex cursor-pointer"
      checked={stream.visible}
      onChange={setVisible}
    >
      <Checkbox.Input class="sr-only"/>
      <Checkbox.Control
        class="h-5 w-5 rounded border border-gray-300 bg-white text-accent focus:ring-2 focus:ring-accent data-[checked]:bg-accent data-[checked]:border-accent transition-all">
        <Checkbox.Indicator>
          <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
            <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2"/>
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label class="ml-2 text-sm font-medium">Visible</Checkbox.Label>
      <Checkbox.Description class="text-xs text-gray-500 ml-2">When checked, this stream will be publicly
        visible.</Checkbox.Description>
    </Checkbox>
  )
}

const Description: Component = () => {
  const {stream, setDescription} = useStreamEditor()

  return (
    <TextField
      name="description"
      class={'flex flex-col'}
      value={stream.description}
      onChange={setDescription}
    >
      <TextField.Label class="text-sm font-medium mb-1">Description: </TextField.Label>
      <TextField.TextArea
        class="border border-gray-300 rounded-lg px-3 py-2 w-full h-24 transition-all focus:ring-2 focus:ring-accent focus:border-accent"
      />
    </TextField>
  )
}

const Vods: Component = () => {

  const {
    stream,
    setYouTubeVodUrl,
    setTwitchVodUrl,
  } = useStreamEditor()

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        name="youtubeVodUrl"
        class="flex flex-col"
        value={stream.youtubeVodUrl}
        onChange={setYouTubeVodUrl}
        validationState={!stream.youtubeVodUrl || stream.youtubeVodUrl === '' || stream.youtubeVodUrl.startsWith('https://www.youtube.com/') || stream.youtubeVodUrl.startsWith('https://youtu.be/') ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">YouTube VOD URL: </TextField.Label>
        <TextField.Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
        />
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
          Must be a valid YouTube URL
        </TextField.ErrorMessage>
      </TextField>

      <TextField
        name="twitchVodUrl"
        class="flex flex-col"
        value={stream.twitchVodUrl}
        onChange={setTwitchVodUrl}
        validationState={!stream.twitchVodUrl || stream.twitchVodUrl === '' || stream.twitchVodUrl.startsWith('https://www.twitch.tv/') ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">Twitch VOD URL: </TextField.Label>
        <TextField.Input
          type="url"
          placeholder="https://www.twitch.tv/videos/..."
          class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
        />
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
          Must be a valid Twitch URL
        </TextField.ErrorMessage>
      </TextField>
    </div>
  )
}

const Dates: Component = () => {
  const {stream, setStart, setEnd} = useStreamEditor()
  const {minStr, maxStr} = useDayCard()
  const start = () => stream.start.toLocal()
  const end = () => stream.end.toLocal()

  const startFormated = () => start().toFormat("yyyy-MM-dd'T'HH:mm")
  const endFormated = () => end().toFormat("yyyy-MM-dd'T'HH:mm")

  const localEndDateMin = () => {
    return start().plus({
      hours: 1,
    }).toFormat("yyyy-MM-dd'T'HH:mm")
  }

  const localStartDateMax = () => {
    return end().minus({
      hours: 1,
    }).toFormat("yyyy-MM-dd'T'HH:mm")
  }
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        name="start"
        class="flex flex-col"
        value={startFormated() ?? ''}
        onChange={(value) => setStart(DateTime.fromISO(value).toUTC())}
        validationState={stream.start < stream.end ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">Start Time: </TextField.Label>
        <TextField.Input
          type="datetime-local"
          class="border border-gray-300 rounded-lg px-3 py-2"
          min={minStr}
          max={localStartDateMax()}
        />
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">Start time must be before end
          time</TextField.ErrorMessage>
        <TextField.Description
          class="text-xs text-gray-500 mt-1">Day: {stream.start.toFormat("cccc, MMMM d")}</TextField.Description>
      </TextField>

      <TextField
        name="end"
        class="flex flex-col"
        value={endFormated() ?? ''}
        onChange={(value) => setEnd(DateTime.fromISO(value).toUTC())}
        validationState={stream.end > stream.start ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">End Time: </TextField.Label>
        <TextField.Input
          type="datetime-local"
          class="border border-gray-300 rounded-lg px-3 py-2"
          min={localEndDateMin()}
          max={maxStr}
        />
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">End time must be after start
          time</TextField.ErrorMessage>
        <TextField.Description
          class="text-xs text-gray-500 mt-1">Day: {stream.end.toFormat("cccc, MMMM d")}</TextField.Description>
      </TextField>
    </div>
  )
}

const Dates2: Component = () => {
  const {action, local} = useScheduleEditor();
  const {stream, setStart, setEnd} = useStreamEditor()

  const otherStreams = () => {
    return local.streams.filter((s) => s.id !== stream.id && s.end.hasSame(stream.end, 'day'))
  }

  const latestStream = () => {
    const streams = otherStreams()
    if (streams.length === 0) return null
    return streams.reduce((latest, current) => {
      return latest.end >= current.end ? latest : current
    })
  }

  const setStartAfterLatestSteam = () => {
    const latest = latestStream()
    if (!latest) return // No latest stream to set after

    // Get current duration
    const currentDuration = durationMinutes()

    // Set start time to the end time of the latest stream
    const newStart = latest.end.toLocal()
    setStart(newStart.toUTC())

    // Update end time based on new start time and current duration
    updateEndFromDuration(currentDuration)
  }

  const {minStr, maxStr, min, max} = useDayCard()
  const start = () => stream.start.toLocal()
  const end = () => stream.end.toLocal()

  const startFormated = () => start().toFormat("yyyy-MM-dd'T'HH:mm")

  // Calculate duration in minutes between start and end
  const durationMinutes = () => {
    const diffMillis = end().diff(start()).milliseconds
    return Math.round(diffMillis / (1000 * 60))
  }

  // Update end time based on start time and duration
  const updateEndFromDuration = (minutes: number) => {
    const newEnd = start().plus({minutes})
    // Ensure end time doesn't exceed max allowed time
    const maxDateTime = DateTime.fromISO(maxStr)
    if (newEnd <= maxDateTime) {
      setEnd(newEnd.toUTC())
    } else {
      setEnd(maxDateTime.toUTC())
    }
  }

  const disableStartMinus15Button = () => {
    const s = start().minus({minutes: 15})
    return s < min
  }

  const disableStartPlus15Button = () => {
    const s = start().plus({minutes: 15})
    return s > max
  }

  const disableStartMinus30Button = () => {
    const s = start().minus({minutes: 30})
    return s < min
  }

  const disableStartPlus30Button = () => {
    const s = start().plus({minutes: 30})
    return s > max
  }

  const disableEndMinus15Button = () => {
    const s = end().minus({minutes: 15})
    return s < min || durationMinutes() <= 15
  }

  const disableEndPlus15Button = () => {
    const s = end().plus({minutes: 15})
    return s > max
  }

  const disableEndMinus30Button = () => {
    const s = end().minus({minutes: 30})
    return s < min || durationMinutes() <= 30
  }

  const disableEndPlus30Button = () => {
    const s = end().plus({minutes: 30})
    return s > max
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        name="start"
        class="flex flex-col"
        value={startFormated() ?? ''}
        onChange={(value) => {
          const currentDuration = durationMinutes()
          const newStart = DateTime.fromISO(value)
          const newEnd = DateTime.fromISO(value).plus({minutes: currentDuration})
          setStart(newStart.toUTC())
          setEnd(newEnd.toUTC())
        }}
        validationState={stream.start < stream.end ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">Start Time: </TextField.Label>
        <TextField.Input
          type="datetime-local"
          class="border border-gray-300 rounded-lg px-3 py-2"
          min={minStr}
          max={maxStr}
        />
        <div class="flex items-center gap-2 mt-1">
          <button
            type="button"
            disabled={!latestStream()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Set start time after latest stream"
            onClick={setStartAfterLatestSteam}
          >
            After Latest
          </button>
          <button
            type="button"
            disabled={disableStartMinus30Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Decrease start time by 30 minutes"
            onClick={() => {
              setStart((d) => d.minus({minutes: 30}))
              setEnd((d) => d.minus({minutes: 30}))
            }}
          >
            -30m
          </button>
          <button
            type="button"
            disabled={disableStartMinus15Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Decrease start time by 15 minutes"
            onClick={() => {
              setStart((d) => d.minus({minutes: 15}))
              setEnd((d) => d.minus({minutes: 15}))
            }}
          >
            -15m
          </button>
          <button
            type="button"
            disabled={disableStartPlus15Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Increase start time by 15 minutes"
            onClick={() => {
              setStart((d) => d.plus({minutes: 15}))
              setEnd((d) => d.plus({minutes: 15}))
            }}
          >
            +15m
          </button>
          <button
            type="button"
            disabled={disableStartPlus30Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Increase start time by 30 minutes"
            onClick={() => {
              setStart((d) => d.plus({minutes: 30}))
              setEnd((d) => d.plus({minutes: 30}))
            }}
          >
            +30m
          </button>
        </div>
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
          Start time must be before end time
        </TextField.ErrorMessage>
        <TextField.Description class="text-xs text-gray-500 mt-1">
          Day: {stream.start.toFormat("cccc, MMMM d")}
        </TextField.Description>
      </TextField>

      <TextField
        name="duration"
        class="flex flex-col"
        value={durationMinutes().toString()}
        onChange={(value) => {
          const minutes = parseInt(value)
          if (!isNaN(minutes) && minutes > 0) {
            updateEndFromDuration(minutes)
          }
        }}
        validationState={durationMinutes() > 0 ? "valid" : "invalid"}
      >
        <TextField.Label class="text-sm font-medium mb-1">Length (minutes): </TextField.Label>
        <TextField.Input
          type="number"
          min="30"
          step="5"
          class="border border-gray-300 rounded-lg px-3 py-2 flex-1"
        />
        <div class="flex items-center gap-2 mt-1">
          <button
            type="button"
            disabled={disableEndMinus30Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Decrease duration by 30 minutes"
            onClick={() => {
              const currentDuration = durationMinutes()
              updateEndFromDuration(Math.max(1, currentDuration - 30))
            }}
          >
            -30m
          </button>
          <button
            type="button"
            disabled={disableEndMinus15Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Decrease duration by 15 minutes"
            onClick={() => {
              const currentDuration = durationMinutes()
              updateEndFromDuration(Math.max(1, currentDuration - 15))
            }}
          >
            -15m
          </button>
          <button
            type="button"
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs"
            title="Set duration to 3 hours"
            onClick={() => {
              updateEndFromDuration(180)
            }}
          >
            3h
          </button>
          <button
            type="button"
            disabled={disableEndPlus15Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Increase duration by 15 minutes"
            onClick={() => {
              const currentDuration = durationMinutes()
              updateEndFromDuration(currentDuration + 15)
            }}
          >
            +15m
          </button>
          <button
            type="button"
            disabled={disableEndPlus30Button()}
            class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Increase duration by 30 minutes"
            onClick={() => {
              const currentDuration = durationMinutes()
              updateEndFromDuration(currentDuration + 30)
            }}
          >
            +30m
          </button>
        </div>
        <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
          Duration must be greater than 0
        </TextField.ErrorMessage>
        <TextField.Description class="text-xs text-gray-500 mt-1">
          End time: {end().toFormat("h:mm a")} ({end().toFormat("cccc, MMMM d")})
        </TextField.Description>
      </TextField>
    </div>
  )
}

const Start: Component = () => {
  const {action, local} = useScheduleEditor();
  const {stream, setStart, setEnd} = useStreamEditor()

  const otherStreams = () => {
    return local.streams.filter((s) => s.id !== stream.id && s.end.hasSame(stream.end, 'day'))
  }

  const latestStream = () => {
    const streams = otherStreams()
    if (streams.length === 0) return null
    return streams.reduce((latest, current) => {
      return latest.end >= current.end ? latest : current
    })
  }

  const setStartAfterLatestSteam = () => {
    const latest = latestStream()
    if (!latest) return // No latest stream to set after

    // Get current duration
    const currentDuration = durationMinutes()

    // Set start time to the end time of the latest stream
    const newStart = latest.end.toLocal()
    setStart(newStart.toUTC())

    // Update end time based on new start time and current duration
    updateEndFromDuration(currentDuration)
  }

  const {minStr, maxStr, min, max} = useDayCard()
  const start = () => stream.start.toLocal()
  const end = () => stream.end.toLocal()

  const startFormated = () => start().toFormat("yyyy-MM-dd'T'HH:mm")

  // Calculate duration in minutes between start and end
  const durationMinutes = () => {
    const diffMillis = end().diff(start()).milliseconds
    return Math.round(diffMillis / (1000 * 60))
  }

  // Update end time based on start time and duration
  const updateEndFromDuration = (minutes: number) => {
    const newEnd = start().plus({minutes})
    // Ensure end time doesn't exceed max allowed time
    const maxDateTime = DateTime.fromISO(maxStr)
    if (newEnd <= maxDateTime) {
      setEnd(newEnd.toUTC())
    } else {
      setEnd(maxDateTime.toUTC())
    }
  }

  const disableStartMinus15Button = () => {
    const s = start().minus({minutes: 15})
    return s < min
  }

  const disableStartPlus15Button = () => {
    const s = start().plus({minutes: 15})
    return s > max
  }

  const disableStartMinus30Button = () => {
    const s = start().minus({minutes: 30})
    return s < min
  }

  const disableStartPlus30Button = () => {
    const s = start().plus({minutes: 30})
    return s > max
  }

  return (
    <TextField
      name="start"
      class="flex flex-col"
      value={startFormated() ?? ''}
      onChange={(value) => {
        const currentDuration = durationMinutes()
        const newStart = DateTime.fromISO(value)
        const newEnd = DateTime.fromISO(value).plus({minutes: currentDuration})
        setStart(newStart.toUTC())
        setEnd(newEnd.toUTC())
      }}
      validationState={stream.start < stream.end ? "valid" : "invalid"}
    >
      <div class="flex items-center gap-2 mb-1">
        <FaRegularClock class="h-4 w-4 text-accent" />
        <TextField.Label class="text-sm font-medium">Start Time: </TextField.Label>
      </div>
      <TextField.Input
        type="datetime-local"
        class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
        min={minStr}
        max={maxStr}
      />
      <div class="flex items-center gap-2 mt-2 flex-wrap">
        <button
          type="button"
          disabled={!latestStream()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Set start time after latest stream"
          onClick={setStartAfterLatestSteam}
        >
          After Latest
        </button>
        <button
          type="button"
          disabled={disableStartMinus30Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease start time by 30 minutes"
          onClick={() => {
            setStart((d) => d.minus({minutes: 30}))
            setEnd((d) => d.minus({minutes: 30}))
          }}
        >
          -30m
        </button>
        <button
          type="button"
          disabled={disableStartMinus15Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease start time by 15 minutes"
          onClick={() => {
            setStart((d) => d.minus({minutes: 15}))
            setEnd((d) => d.minus({minutes: 15}))
          }}
        >
          -15m
        </button>
        <button
          type="button"
          disabled={disableStartPlus15Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Increase start time by 15 minutes"
          onClick={() => {
            setStart((d) => d.plus({minutes: 15}))
            setEnd((d) => d.plus({minutes: 15}))
          }}
        >
          +15m
        </button>
        <button
          type="button"
          disabled={disableStartPlus30Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Increase start time by 30 minutes"
          onClick={() => {
            setStart((d) => d.plus({minutes: 30}))
            setEnd((d) => d.plus({minutes: 30}))
          }}
        >
          +30m
        </button>
      </div>
      <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
        Start time must be before end time
      </TextField.ErrorMessage>
      <TextField.Description class="text-xs text-gray-500 mt-1">
        Day: {stream.start.toFormat("cccc, MMMM d")}
      </TextField.Description>
    </TextField>
  )
}

const End: Component = () => {
  const {stream, setEnd} = useStreamEditor()
  const {maxStr} = useDayCard()
  const start = () => stream.start.toLocal()

  const end = () => stream.end.toLocal()
  const endFormated = () => end().toFormat("yyyy-MM-dd'T'HH:mm")

  const localEndDateMin = () => {
    return start().plus({
      hours: 1,
    }).toFormat("yyyy-MM-dd'T'HH:mm")
  }

  return (
    <TextField
      name="end"
      class="flex flex-col"
      value={endFormated() ?? ''}
      onChange={(value) => setEnd(DateTime.fromISO(value).toUTC())}
      validationState={stream.end > stream.start ? "valid" : "invalid"}
    >
      <TextField.Label class="text-sm font-medium mb-1">End Time: </TextField.Label>
      <TextField.Input
        type="datetime-local"
        class="border border-gray-300 rounded-lg px-3 py-2"
        min={localEndDateMin()}
        max={maxStr}
      />
      <TextField.ErrorMessage class="text-red-500 text-xs mt-1">End time must be after start
        time</TextField.ErrorMessage>
      <TextField.Description
        class="text-xs text-gray-500 mt-1">Day: {stream.end.toFormat("cccc, MMMM d")}</TextField.Description>
    </TextField>
  )
}

const Duration: Component = () => {
  const {stream, setEnd} = useStreamEditor()

  const {maxStr, min, max} = useDayCard()
  const start = () => stream.start.toLocal()
  const end = () => stream.end.toLocal()

  // Calculate duration in minutes between start and end
  const durationMinutes = () => {
    const diffMillis = end().diff(start()).milliseconds
    return Math.round(diffMillis / (1000 * 60))
  }

  // Update end time based on start time and duration
  const updateEndFromDuration = (minutes: number) => {
    const newEnd = start().plus({minutes})
    // Ensure end time doesn't exceed max allowed time
    const maxDateTime = DateTime.fromISO(maxStr)
    if (newEnd <= maxDateTime) {
      setEnd(newEnd.toUTC())
    } else {
      setEnd(maxDateTime.toUTC())
    }
  }

  const disableEndMinus15Button = () => {
    const s = end().minus({minutes: 15})
    return s < min || durationMinutes() <= 15
  }

  const disableEndPlus15Button = () => {
    const s = end().plus({minutes: 15})
    return s > max
  }

  const disableEndMinus30Button = () => {
    const s = end().minus({minutes: 30})
    return s < min || durationMinutes() <= 30
  }

  const disableEndPlus30Button = () => {
    const s = end().plus({minutes: 30})
    return s > max
  }

  return (
    <TextField
      name="duration"
      class="flex flex-col"
      value={durationMinutes().toString()}
      onChange={(value) => {
        const minutes = parseInt(value)
        if (!isNaN(minutes) && minutes > 0) {
          updateEndFromDuration(minutes)
        }
      }}
      validationState={durationMinutes() > 0 ? "valid" : "invalid"}
    >
      <div class="flex items-center gap-2 mb-1">
        <FaRegularClock class="h-4 w-4 text-accent" />
        <TextField.Label class="text-sm font-medium">Length (minutes): </TextField.Label>
      </div>
      <TextField.Input
        type="number"
        min="30"
        step="5"
        class="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all focus:ring-2 focus:ring-accent focus:border-accent"
      />
      <div class="flex items-center gap-2 mt-2 flex-wrap">
        <button
          type="button"
          disabled={disableEndMinus30Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease duration by 30 minutes"
          onClick={() => {
            const currentDuration = durationMinutes()
            updateEndFromDuration(Math.max(1, currentDuration - 30))
          }}
        >
          -30m
        </button>
        <button
          type="button"
          disabled={disableEndMinus15Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease duration by 15 minutes"
          onClick={() => {
            const currentDuration = durationMinutes()
            updateEndFromDuration(Math.max(1, currentDuration - 15))
          }}
        >
          -15m
        </button>
        <button
          type="button"
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs"
          title="Set duration to 3 hours"
          onClick={() => {
            updateEndFromDuration(180)
          }}
        >
          3h
        </button>
        <button
          type="button"
          disabled={disableEndPlus15Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Increase duration by 15 minutes"
          onClick={() => {
            const currentDuration = durationMinutes()
            updateEndFromDuration(currentDuration + 15)
          }}
        >
          +15m
        </button>
        <button
          type="button"
          disabled={disableEndPlus30Button()}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Increase duration by 30 minutes"
          onClick={() => {
            const currentDuration = durationMinutes()
            updateEndFromDuration(currentDuration + 30)
          }}
        >
          +30m
        </button>
      </div>
      <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
        Duration must be greater than 0
      </TextField.ErrorMessage>
      <TextField.Description class="text-xs text-gray-500 mt-1">
        End time: {end().toFormat("h:mm a")} ({end().toFormat("cccc, MMMM d")})
      </TextField.Description>
    </TextField>
  )
}

const DurationAndEndSwitch: Component = () => {
  const [showDuration, setShowDuration] = createSignal(true);

  return (
    <div class="flex flex-col">
      <div class="flex items-center justify-start mb-2">
        <div class="bg-gray-200 rounded-lg p-1 flex">
          <button
            type="button"
            class={`px-3 py-1 rounded-l-lg transition-all text-sm ${showDuration() ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
            onClick={() => setShowDuration(true)}
          >
            Duration
          </button>
          <button
            type="button"
            class={`px-3 py-1 rounded-r-lg transition-all text-sm ${!showDuration() ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
            onClick={() => setShowDuration(false)}
          >
            End Time
          </button>
        </div>
      </div>
      <Show when={showDuration()} fallback={<End/>}>
        <Duration/>
      </Show>
    </div>
  )
}

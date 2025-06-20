import {DateTime} from "luxon";
import type {ModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {type Component, Show} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {createStore} from "solid-js/store";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {TagsSection} from "./TagsSection.tsx";
import {StreamParticipantsSection} from "./StreamParticipantsSection.tsx";

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
    tags?: {label: string, tag: string}[];
    participants?: { userId: number, providerName: string, provider: string }[];
    createdBy: number;
  };
  editStreamDialog: ModalSignal,
  deleteDialog: ModalSignal,
}

export const ScheduleEditorStreamEditDialogBody: Component<ScheduleEditorStreamEditDialogBodyProps> = (props) => {
  const {
    saveStream,
    action,
  } = useScheduleEditor();


  const [stream, setStream] = createStore<{
    id: string,
    title: string,
    subtitle: string,
    description: string,
    youtubeVodUrl: string,
    twitchVodUrl: string,
    start: DateTime,
    end: DateTime,
    visible: boolean,
    tags: {label: string, tag: string}[],
    participants: { userId: number, providerName: string, provider: string }[],
    createdBy: number
  }>({
    id: props.stream.id,
    title: props.stream.title,
    subtitle: props.stream.subtitle,
    description: props.stream.description,
    youtubeVodUrl: props.stream.youtubeVodUrl || '',
    twitchVodUrl: props.stream.twitchVodUrl || '',
    visible: props.stream.visible,
    start: props.stream.start,
    end: props.stream.end,
    tags: props.stream.tags || [],
    participants: props.stream.participants || [],
    createdBy: props.stream.createdBy
  })

  const save = (e: SubmitEvent) => {
    e.preventDefault(); // Prevent default form submission
    saveStream(stream);
    props.editStreamDialog.close()
  }

  return (
    <form class="space-y-4" onSubmit={save}>
      <TextField
        name="title"
        class="flex flex-col"
        value={stream.title}
        onChange={(value) => setStream('title', value)}
      >
        <TextField.Label class="text-sm font-medium mb-1">Title: </TextField.Label>
        <TextField.Input
          class="border border-gray-300 rounded-lg px-3 py-2"
        />
      </TextField>

      <TextField
        name="subtitle"
        class="flex flex-col"
        value={stream.subtitle}
        onChange={(value) => setStream('subtitle', value)}
      >
        <TextField.Label class="text-sm font-medium mb-1">Subtitle: </TextField.Label>
        <TextField.Input
          class="border border-gray-300 rounded-lg px-3 py-2"
        />
      </TextField>

      <TextField
        name="description"
        class={'flex flex-col'}
        value={stream.description}
        onChange={(value) => setStream('description', value)}
      >
        <TextField.Label class="text-sm font-medium mb-1">Description: </TextField.Label>
        <TextField.TextArea
          class="border border-gray-300 rounded-lg px-3 py-2 w-full h-24"
        />
      </TextField>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          name="youtubeVodUrl"
          class="flex flex-col"
          value={stream.youtubeVodUrl}
          onChange={(value) => setStream('youtubeVodUrl', value)}
          validationState={!stream.youtubeVodUrl || stream.youtubeVodUrl === '' || stream.youtubeVodUrl.startsWith('https://www.youtube.com/') || stream.youtubeVodUrl.startsWith('https://youtu.be/') ? "valid" : "invalid"}
        >
          <TextField.Label class="text-sm font-medium mb-1">YouTube VOD URL: </TextField.Label>
          <TextField.Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="border border-gray-300 rounded-lg px-3 py-2"
          />
          <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
            Must be a valid YouTube URL
          </TextField.ErrorMessage>
        </TextField>

        <TextField
          name="twitchVodUrl"
          class="flex flex-col"
          value={stream.twitchVodUrl}
          onChange={(value) => setStream('twitchVodUrl', value)}
          validationState={!stream.twitchVodUrl || stream.twitchVodUrl === '' || stream.twitchVodUrl.startsWith('https://www.twitch.tv/') ? "valid" : "invalid"}
        >
          <TextField.Label class="text-sm font-medium mb-1">Twitch VOD URL: </TextField.Label>
          <TextField.Input
            type="url"
            placeholder="https://www.twitch.tv/videos/..."
            class="border border-gray-300 rounded-lg px-3 py-2"
          />
          <TextField.ErrorMessage class="text-red-500 text-xs mt-1">
            Must be a valid Twitch URL
          </TextField.ErrorMessage>
        </TextField>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          name="start"
          class="flex flex-col"
          value={stream.start.toFormat("yyyy-MM-dd'T'HH:mm") ?? ''}
          onChange={(value) => setStream('start', DateTime.fromISO(value).setZone('utc'))}
          validationState={stream.start < stream.end ? "valid" : "invalid"}
        >
          <TextField.Label class="text-sm font-medium mb-1">Start Time: </TextField.Label>
          <TextField.Input
            type="datetime-local"
            class="border border-gray-300 rounded-lg px-3 py-2"
          />
          <TextField.ErrorMessage class="text-red-500 text-xs mt-1">Start time must be before end
            time</TextField.ErrorMessage>
          <TextField.Description
            class="text-xs text-gray-500 mt-1">Day: {stream.start.toFormat("cccc, MMMM d")}</TextField.Description>
        </TextField>

        <TextField
          name="end"
          class="flex flex-col"
          value={stream.end.toFormat("yyyy-MM-dd'T'HH:mm") ?? ''}
          onChange={(value) => setStream('end', DateTime.fromISO(value).setZone('utc'))}
          validationState={stream.end > stream.start ? "valid" : "invalid"}
        >
          <TextField.Label class="text-sm font-medium mb-1">End Time: </TextField.Label>
          <TextField.Input
            type="datetime-local"
            class="border border-gray-300 rounded-lg px-3 py-2"
          />
          <TextField.ErrorMessage class="text-red-500 text-xs mt-1">End time must be after start
            time</TextField.ErrorMessage>
          <TextField.Description
            class="text-xs text-gray-500 mt-1">Day: {stream.end.toFormat("cccc, MMMM d")}</TextField.Description>
        </TextField>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagsSection
          streamId={stream.id}
        />
        <StreamParticipantsSection
          streamId={stream.id}
        />
      </div>

      <Checkbox
        name="visible"
        class="items-center inline-flex cursor-pointe"
        checked={stream.visible}
        onChange={(checked) => setStream('visible', checked)}
      >
        <Checkbox.Input class="sr-only"/>
        <Checkbox.Control
          class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
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
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
          disabled={action.saveStream.actionInProgress}
        >
          Delete
        </button>
        <button
          type="submit"
          class="bg-accent hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={action.saveStream.actionInProgress}
        >
          {action.saveStream.actionInProgress ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Display loading indicator when saving */}
      <Show when={action.saveStream.actionInProgress}>
        <div class="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-xl">
            <div class="flex items-center gap-2">
              <div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <span>Saving stream...</span>
            </div>
          </div>
        </div>
      </Show>
    </form>

  );
}

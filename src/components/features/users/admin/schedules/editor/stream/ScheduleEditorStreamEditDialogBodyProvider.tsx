import {createContext, type ParentComponent, useContext} from "solid-js";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {useDayCard} from "../DayCardContext.tsx";
import {DateTime} from "luxon";
import type {ModalSignal} from "../../../../../../../lib/createModalSignal.ts";
import {createStore} from "solid-js/store";

type ValueOrSetter<T> = (T | ((prev: T) => T))

const useScheduleEditorStreamEditDialogBodyHook = (props: {
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
}) => {
  const {
    saveStream,
    action,
  } = useScheduleEditor();
  const {minStr, maxStr} = useDayCard()

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
    tags: { label: string, tag: string }[],
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

  const save = (e: SubmitEvent) => {
    e.preventDefault(); // Prevent default form submission
    saveStream(stream);
    props.editStreamDialog.close()
  }

  const setTitle = (title: ValueOrSetter<string>) => {
    setStream('title', title)
  }

  const setSubtitle = (title: ValueOrSetter<string>) => {
    setStream('subtitle', title);
  }

  const setDescription = (description: ValueOrSetter<string>) => {
    setStream('description', description);
  }

  const setStart = (date: ValueOrSetter<DateTime>) => {
    setStream('start', date)
  }

  const setEnd = (date: ValueOrSetter<DateTime>) => {
    setStream('end', date)
  }

  const setVisible = (visible: ValueOrSetter<boolean>) => {
    setStream('visible', visible)
  }

  const addParticipant = (participant: {
    userId: number
    providerName: string
    provider: string
  }) => {
    setStream('participants', (lst) => [...lst, participant])
  }

  const removeParticipant = (participantId: number) => {
    setStream('participants', (lst) => lst.filter((participant) => participantId !== participantId))
  }

  const addTag = (tag: {
    label: string
    tag: string
  }) => {
    setStream('tags', (lst) => [...lst, tag])
  }

  const removeTag = (tag: string) => {
    setStream('tags', (lst) => lst.filter((t) => t.tag !== tag))
  }

  const setYouTubeVodUrl = (url: ValueOrSetter<string>) => {
    setStream('youtubeVodUrl', url)
  }

  const setTwitchVodUrl = (url: ValueOrSetter<string>) => {
    setStream('twitchVodUrl', url)
  }

  return {
    stream: stream,
    save: save,
    setTitle,
    setSubtitle,
    setDescription,
    setStart,
    setEnd,
    setVisible,
    addParticipant,
    removeParticipant,
    addTag,
    removeTag,
    localEndDateMin,
    localStartDateMax,
    setYouTubeVodUrl,
    setTwitchVodUrl,
  }
}

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

const ScheduleEditorStreamEditDialogBodyContext = createContext<ReturnType<typeof useScheduleEditorStreamEditDialogBodyHook>>();

export const ScheduleEditorStreamEditDialogBodyProvider: ParentComponent<ScheduleEditorStreamEditDialogBodyProps> = (props) => {
  const hook = useScheduleEditorStreamEditDialogBodyHook(props)
  return (
    <ScheduleEditorStreamEditDialogBodyContext.Provider value={hook}>
      {props.children}
    </ScheduleEditorStreamEditDialogBodyContext.Provider>
  );
}
export const useStreamEditor = () => useContext(ScheduleEditorStreamEditDialogBodyContext)!

import {type Component, Show} from "solid-js";
import {useScheduleEditor2} from "../../../ScheduleEditorProvider.tsx";
import {StreamMetaSection} from "./sections/StreamMetaSection.tsx";
import {StreamTimeSection} from "./sections/StreamTimeSection.tsx";
import {StreamLinksSection} from "./sections/StreamLinksSection.tsx";
import {StreamDescriptionSection} from "./sections/StreamDescriptionSection.tsx";
import {StreamParticipantsSection} from "./sections/StreamParticipantsSection.tsx";
import {StreamTagsSection} from "./sections/StreamTagsSection.tsx";

export const StreamEditFormBody: Component<{ streamId: number }> = (props) => {
  const { state } = useScheduleEditor2();
  const stream = () => state.streams.find((s) => s.id === props.streamId);

  return (
    <Show when={stream()}>
      {(s) => (
        <div class="flex flex-col gap-6">
          <StreamMetaSection streamId={s().id} />
          <StreamTimeSection streamId={s().id} />
          <StreamLinksSection streamId={s().id} />
          <StreamDescriptionSection streamId={s().id} />
          <StreamParticipantsSection streamId={s().id} />
          <StreamTagsSection streamId={s().id} />
        </div>
      )}
    </Show>
  );
};

export default StreamEditFormBody;

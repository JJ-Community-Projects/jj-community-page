import {type Component, For} from "solid-js";
import type {DetailedStream} from "../../../../lib/db/repos/ScheduleModel.ts";
import {ScheduleStreamCard} from "./StreamCard.tsx";
import {twMerge} from "tailwind-merge";

interface StreamWrapCardProps {
  streams: DetailedStream[]
  class?: string
}

export const StreamWrap: Component<StreamWrapCardProps> = (props) => {
  return (
    <div class={twMerge(props.class, "flex flex-wrap gap-2")}>
      <For each={props.streams}>
        {
          (stream) => (
            <ScheduleStreamCard stream={stream} type="filled" hover={false}/>
          )
        }
      </For>
    </div>
  );
}

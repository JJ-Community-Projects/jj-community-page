import {type Component, Show} from "solid-js";
import type {IconTypes} from "solid-icons";

interface H1IconCardProps {
  title: string;
  icon?: IconTypes
}

export const H1IconCard: Component<H1IconCardProps> = (props) => {
  return (
    <div
      class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4 ">
      <h1 class="text-3xl font-bold text-gray-900 text-center inline-flex items-center gap-2">
        <Show when={props.icon}>
          {props.icon!({
            class: "w-6 h-6 text-gray-700"
          })}
        </Show>
        <span>{props.title}</span>
      </h1>
    </div>
  );
}

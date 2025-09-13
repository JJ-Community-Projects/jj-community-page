import {type Component, Show} from "solid-js";
import type {IconTypes} from "solid-icons";

interface H3IconCardProps {
  title: string;
  icon?: IconTypes
}

export const H3IconCard: Component<H3IconCardProps> = (props) => {
  return (
    <div
      class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4 ">
      <h3 class="text-xl font-bold text-gray-900 text-center inline-flex items-center gap-2">
        <Show when={props.icon}>
          {props.icon!({
            class: "w-5 h-5 text-gray-700"
          })}
        </Show>
        <span>{props.title}</span>
      </h3>
    </div>
  );
}

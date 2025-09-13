import {type Component, Show} from "solid-js";
import type {IconTypes} from "solid-icons";

interface H2IconCardProps {
  title: string;
  icon?: IconTypes
}

export const H2IconCard: Component<H2IconCardProps> = (props) => {
  return (
    <div
      class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4 ">
      <h2 class="text-2xl font-bold text-gray-900 text-center inline-flex items-center gap-2">
        <Show when={props.icon}>
          {props.icon!({
            class: "w-5 h-5 text-gray-700"
          })}
        </Show>
        <span>{props.title}</span>
      </h2>
    </div>
  );
}

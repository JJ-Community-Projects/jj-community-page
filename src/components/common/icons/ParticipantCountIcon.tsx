import type { Component } from "solid-js";
import {FaSolidPeopleLine, FaSolidUsers} from "solid-icons/fa";

export const ParticipantCountIcon: Component<{
  count: number;
  class?: string;
}> = (props) => {
  const displayCount = props.count > 4 ? "4+" : props.count.toString();
  return (
    <div class={`inline-flex items-center ${props.class || ""}`}>
      <FaSolidUsers/>
      <span class="text-xxs font-medium">{displayCount}</span>
    </div>
  );
};

import {type Component, For, Show} from "solid-js";
import type {ParticipantUI} from "../../../../lib/db/models/schedule-ui.ts";

interface StreamParticipantsProps {
  participants: ParticipantUI[];
}

/**
 * Component to display stream participants as circle images with colored borders
 */
export const StreamParticipants: Component<StreamParticipantsProps> = (props) => {
  return (
    <Show when={props.participants && props.participants.length > 0}>
      <p class="text-lg mt-4">Participants</p>
      <div class="flex flex-wrap gap-2 mt-1">
        <For each={props.participants}>
          {(participant) => (
            <div
              class="relative w-10 h-10 rounded-full overflow-hidden"
              style={{
                "border": `2px solid ${participant.style?.primaryColor || '#3584BF'}`,
                "box-shadow": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"
              }}
              title={participant.label}
            >
              {participant.img ? (
                <img
                  src={participant.img}
                  alt={participant.label}
                  class="w-full h-full object-cover"
                />
              ) : (
                <div
                  class="w-full h-full flex items-center justify-center bg-accent-100 text-accent-800 font-bold"
                >
                  {participant.label.substring(0, 2)}
                </div>
              )}
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}

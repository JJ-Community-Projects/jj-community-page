import {type Component, For, Show} from "solid-js";
import type {UserDisplay} from "../../../../lib/orpc/public/schemas/UserDisplaySchema.ts";

interface StreamParticipantsProps {
  participants: UserDisplay[];
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
            <StreamParticipant participant={participant}/>
          )}
        </For>
      </div>
    </Show>
  );
}


const StreamParticipant: Component<{ participant: UserDisplay }> = (props) => {

  const url = () => {
    if (props.participant.twitchLogin) {
      return `https://twitch.tv/${props.participant.twitchLogin}`
    }
    return `/${props.participant.username}`
  }

  return (
    <a
      href={url()}
      class="flex flex-col items-center gap-0"
      title={props.participant.username}
    >

      <div class={'relative inline-block'}>

        <div
          class="relative w-10 h-10 rounded-full overflow-hidden"
          style={{
            "border": `2px solid ${props.participant.primaryColor || '#3584BF'}`,
            "box-shadow": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"
          }}
        >
          <Show when={props.participant.profileImage} fallback={<div
            class="w-full h-full flex items-center justify-center bg-accent-100 text-accent-800 font-bold"
          >
            {props.participant.username.substring(0, 2)}
          </div>}>
            <img
              src={props.participant.profileImage}
              alt={props.participant.username}
              class="w-full h-full object-cover"
            />
          </Show>

        </div>
      </div>


      {/* Participant name/label */}
      <div class="text-xs mt-1 text-center max-w-[80px] truncate">
        {props.participant.username}
      </div>
    </a>
  )
}

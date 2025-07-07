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
            <StreamParticipant participant={participant}/>
          )}
        </For>
      </div>
    </Show>
  );
}


const StreamParticipant: Component<{ participant: ParticipantUI }> = (props) => {

  const isLive = () => props.participant.liveState.isLive

  const twitchChannel = () => props.participant.liveState.channel.twitch


  const url = () => {
    if (isLive() && twitchChannel()) {
      return `https://twitch.tv/${twitchChannel()?.login}`
    }
    return `/${props.participant.liveState.name}`
  }

  return (
    <a
      href={url()}
      class="flex flex-col items-center gap-0"
      title={props.participant.label}
    >

      <div class={'relative inline-block'}>

        <div
          class="relative w-10 h-10 rounded-full overflow-hidden"
          style={{
            "border": `2px solid ${props.participant.style?.primaryColor || '#3584BF'}`,
            "box-shadow": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"
          }}
        >
          <Show when={props.participant.style.profileImage.default} fallback={<div
            class="w-full h-full flex items-center justify-center bg-accent-100 text-accent-800 font-bold"
          >
            {props.participant.label.substring(0, 2)}
          </div>}>
            <img
              src={props.participant.style.profileImage.default}
              alt={props.participant.label}
              class="w-full h-full object-cover"
            />
          </Show>

        </div>
        {/* Live indicator */}
        <Show when={isLive()}>
          <div
            class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-twitch text-white text-xxxs px-0.5 py-0.25 rounded-sm flex items-center gap-0.5 z-20 shadow-sm">
            <span>LIVE</span>
            <span class="relative flex h-1 w-1">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700"/>
            <span class="relative inline-flex h-full w-full rounded-full bg-red-500"/>
          </span>
          </div>
        </Show>
      </div>


      {/* Participant name/label */}
      <div class="text-xs mt-1 text-center max-w-[80px] truncate">
        {props.participant.label}
      </div>
    </a>
  )
}

import { type Component, For, Show } from 'solid-js'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { getTextColor } from '../../../../lib/utils/textColors.ts'

interface StreamParticipantsProps {
  participants: UserDisplay[]
}

/**
 * Component to display stream participants as circle images with colored borders
 */
export const StreamParticipants: Component<StreamParticipantsProps> = (
  props,
) => {
  return (
    <Show when={props.participants && props.participants.length > 0}>
      <p class="mt-4 text-lg">Participants</p>
      <div class="mt-1 flex flex-wrap gap-2">
        <For each={props.participants}>
          {(participant) => <StreamParticipant participant={participant} />}
        </For>
      </div>
    </Show>
  )
}

const StreamParticipant: Component<{ participant: UserDisplay }> = (props) => {
  const hasTwitchLogin = () =>
    props.participant.twitchLogin !== null &&
    props.participant.twitchLogin !== ''

  const url = () => {
    if (hasTwitchLogin()) {
      return `https://twitch.tv/${props.participant.twitchLogin}`
    }
    if (props.participant.userId < 0) {
      return ''
    }
    return `/${props.participant.username}`
  }

  const primaryColor = () => {
    if (hasTwitchLogin()) {
      return '#9146FF'
    }
    return props.participant.primaryColor ?? '#E30E50'
  }

  const accentColor = () => props.participant.accentColor ?? primaryColor()

  const textColor = () => getTextColor(primaryColor())

  return (
    <a
      href={url()}
      class="flex cursor-pointer flex-row items-center gap-2 rounded-full p-2 transition-all duration-200 hover:scale-105 hover:brightness-105"
      style={{
        'background-color': primaryColor(),
        color: textColor(),
      }}
      title={url()}
    >
      <img
        src={props.participant.profileImage}
        alt={`${props.participant.username}'s profile`}
        height="16"
        width="16"
        class="h-4 w-4 rounded-full border-2"
        style={{
          'border-color': accentColor(),
        }}
        loading="lazy"
      />
      <span class="font-poppins text-xs font-medium">
        {props.participant.username}
      </span>
    </a>
  )
}

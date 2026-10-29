import { type Component, For, Show } from 'solid-js'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema.ts'
import { UserPill } from '../../../common/UserPill'

/** Small caps label above each section of the stream dialog (the extension's section label). */
export const sectionLabel =
  'text-fg-muted text-xxs font-bold tracking-wider uppercase'

/** The stream's participants in the detail dialog: Twitch when known, else the profile. */
export const StreamParticipants: Component<{ participants: UserDisplay[] }> = (
  props,
) => {
  const url = (participant: UserDisplay) => {
    if (participant.twitchLogin) {
      return `https://twitch.tv/${participant.twitchLogin}`
    }
    if (participant.userId < 0) {
      return ''
    }
    return `/${participant.username}`
  }
  return (
    <Show when={props.participants && props.participants.length > 0}>
      <section class="flex flex-col gap-1.5">
        <h3 class={sectionLabel}>Participants</h3>
        <div class="flex flex-wrap gap-1.5">
          <For each={props.participants}>
            {(participant) => (
              <UserPill user={participant} href={url(participant)} />
            )}
          </For>
        </div>
      </section>
    </Show>
  )
}

import { type Component, For, Show } from 'solid-js'
import { useScheduleEditor2 } from '../../../ScheduleEditorProvider.tsx'
import { useStreamEditorDialog } from './StreamEditorDialogContext.tsx'
import { FieldGroup } from '../shared/StreamFields.tsx'
import { Avatar } from '../../../../../../../../ui/Avatar'
import { Button } from '../../../../../../../../ui/Button'
import { cn, groupSurface } from '../../../../../../../../ui/cn'

type Person = {
  username?: string | null
  twitchLogin?: string | null
  tiltifySlug?: string | null
  profileImage?: string | null
}

const nameOf = (u: Person) => u.username || u.twitchLogin || u.tiltifySlug || ''

// The browser tests scope these lists by their label's parent, and a person's button by the name's parent
const PersonRow: Component<{
  person: Person
  name: string
  action: 'Add' | 'Remove'
  onClick: () => void
}> = (props) => (
  <div class="flex items-center gap-2 px-2 py-1.5">
    <Avatar size="xs" src={props.person.profileImage} alt="" fallback={props.name.charAt(0)} />
    <span class="min-w-0 flex-1 truncate text-sm">{props.name}</span>
    <Button
      size="sm"
      variant={props.action === 'Add' ? 'accent' : 'danger'}
      onClick={() => props.onClick()}
    >
      {props.action}
    </Button>
  </div>
)

export const StreamParticipantsSection: Component = () => {
  const { relations } = useScheduleEditor2()
  const { addParticipantLocal, removeParticipantLocal, draft } =
    useStreamEditorDialog()

  const participants = () => draft.participants ?? []
  const participantsIds = () => participants().map((p) => p.userId)

  const friends = () => relations.data?.friends ?? []

  const friendIds = () => friends().map((p) => p.userId)

  const filteredFriends = () =>
    friends().filter((friend) => !participantsIds().includes(friend.userId))

  const teamMates = () => relations.data?.teamMates ?? []

  const filteredTeamMates = () =>
    teamMates()
      .filter((teamMate) => !participantsIds().includes(teamMate.userId))
      .filter((teamMate) => !friendIds().includes(teamMate.userId))

  const onAddLocal = (u: any) => {
    addParticipantLocal({
      userId: u.userId,
      createdAt: new Date(),
      primaryLiveStream: u.primaryLiveStream ?? null,
      username: u.username ?? undefined,
      profileImage: u.profileImage ?? undefined,
      twitchLogin: u.twitchLogin ?? undefined,
      tiltifySlug: u.tiltifySlug ?? undefined,
      tiltifyUrl: u.tiltifyUrl ?? undefined,
      primaryColor: u.primaryColor ?? undefined,
      accentColor: u.accentColor ?? undefined,
    })
  }

  const onRemoveLocal = (userId: number) => removeParticipantLocal(userId)

  const listClass = cn(groupSurface, 'divide-line divide-y')

  return (
    <FieldGroup title="Participants">
      <Show when={participants().length > 0}>
        <div class="flex flex-col gap-1">
          <p class="text-fg-muted text-xs font-semibold">Current participants</p>
          <div class={listClass}>
            <For each={participants()}>
              {(p) => (
                <PersonRow
                  person={p}
                  name={nameOf(p) || `User #${p.userId}`}
                  action="Remove"
                  onClick={() => onRemoveLocal(p.userId)}
                />
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={relations.isLoading}>
        <p class="text-fg-muted text-xs">Loading relations…</p>
      </Show>
      <Show when={relations.isSuccess && relations.data}>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <p class="text-fg-muted text-xs font-semibold">Your Friends</p>
            <Show
              when={filteredFriends().length > 0}
              fallback={<p class="text-fg-muted px-2 text-xs">Nobody left to add</p>}
            >
              <div class={listClass}>
                <For each={filteredFriends()}>
                  {(user) => (
                    <PersonRow person={user} name={nameOf(user)} action="Add" onClick={() => onAddLocal(user)} />
                  )}
                </For>
              </div>
            </Show>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-fg-muted text-xs font-semibold">Your Team Mates</p>
            <Show
              when={filteredTeamMates().length > 0}
              fallback={<p class="text-fg-muted px-2 text-xs">Nobody left to add</p>}
            >
              <div class={listClass}>
                <For each={filteredTeamMates()}>
                  {(user) => (
                    <PersonRow person={user} name={nameOf(user)} action="Add" onClick={() => onAddLocal(user)} />
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </FieldGroup>
  )
}

export default StreamParticipantsSection

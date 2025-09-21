import { type Component, For, Show } from 'solid-js'
import { useScheduleEditor2 } from '../../../../ScheduleEditorProvider.tsx'
import { useStreamEditorDialog } from '../StreamEditorDialogContext.tsx'

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

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Participants</h3>

      <Show when={relations.isLoading}>
        <div class="text-xs text-gray-500">Loading relations…</div>
      </Show>
      <Show when={relations.isSuccess && relations.data}>
        <div class="flex flex-row items-stretch gap-2">
          <div class="flex-1">
            <p class="mb-1 text-xs text-gray-500">Your Friends</p>
            <For each={filteredFriends()}>
              {(user) => {
                return (
                  <div class="flex items-center justify-between p-2">
                    <div class="text-sm">
                      {user.username || user.twitchLogin || user.tiltifySlug}
                    </div>
                    <button
                      class="rounded bg-accent px-2 py-1 text-sm text-white hover:bg-accent-600"
                      onClick={() => onAddLocal(user)}
                    >
                      Add
                    </button>
                  </div>
                )
              }}
            </For>
          </div>
          <div class="flex-1">
            <p class="mb-1 text-xs text-gray-500">Your Team Mates</p>
            <For each={filteredTeamMates()}>
              {(user) => {
                return (
                  <div class="flex items-center justify-between p-2">
                    <div class="text-sm">
                      {user.username || user.twitchLogin || user.tiltifySlug}
                    </div>
                    <button
                      class="rounded bg-accent px-2 py-1 text-sm text-white hover:bg-accent-600"
                      onClick={() => onAddLocal(user)}
                    >
                      Add
                    </button>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>

      <Show when={participants().length > 0}>
        <div>
          <p class="mb-1 text-xs text-gray-500">Current participants</p>
          <div class="divide-y rounded border">
            <For each={participants()}>
              {(p) => {
                return (
                  <div class="flex items-center justify-between p-2">
                    <div class="text-sm">
                      {p.username ||
                        p.twitchLogin ||
                        p.tiltifySlug ||
                        `User #${p.userId}`}
                    </div>
                    <button
                      class="rounded bg-danger px-2 py-1 text-sm text-white hover:bg-danger-600"
                      onClick={() => onRemoveLocal(p.userId)}
                    >
                      Remove
                    </button>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default StreamParticipantsSection

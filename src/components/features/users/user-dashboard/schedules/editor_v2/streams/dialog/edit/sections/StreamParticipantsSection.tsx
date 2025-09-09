import {type Component, For, Show} from "solid-js";
import {useScheduleEditor2} from "../../../../ScheduleEditorProvider.tsx";
import {useStreamEditorDialog} from "../StreamEditorDialogContext.tsx";

export const StreamParticipantsSection: Component = () => {
  const {relations} = useScheduleEditor2();
  const {addParticipantLocal, removeParticipantLocal, draft} = useStreamEditorDialog();

  const participants = () => draft.participants ?? [];

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
    });
  };

  const onRemoveLocal = (userId: number) => removeParticipantLocal(userId);

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Participants</h3>

      <Show when={relations.isLoading}>
        <div class="text-xs text-gray-500">Loading relations…</div>
      </Show>
      <Show when={relations.isSuccess && relations.data }>

        <div>
          <p class="text-xs text-gray-500 mb-1">Your Friends</p>
          <For each={relations.data!.friends}>
            {
              (user) => {
                return (
                  <div class="p-2 flex items-center justify-between">
                    <div class="text-sm">{user.username || user.twitchLogin || user.tiltifySlug}</div>
                    <button
                      class="text-sm px-2 py-1 bg-accent text-white rounded hover:bg-accent-600"
                      onClick={() => onAddLocal(user)}
                    >
                      Add
                    </button>
                  </div>
                )
              }
            }
          </For>
          <p class="text-xs text-gray-500 mb-1">Your Team Mates</p>
          <For each={relations.data!.teamMates}>
            {
              (user) => {
                return (
                  <div class="p-2 flex items-center justify-between">
                    <div class="text-sm">{user.username || user.twitchLogin || user.tiltifySlug}</div>
                    <button
                      class="text-sm px-2 py-1 bg-accent text-white rounded hover:bg-accent-600"
                      onClick={() => onAddLocal(user)}
                    >
                      Add
                    </button>
                  </div>
                )
              }
            }
          </For>
        </div>
      </Show>


      <Show when={participants().length > 0}>
        <div>
          <p class="text-xs text-gray-500 mb-1">Current participants</p>
          <div class="border rounded divide-y">
            <For each={participants()}>
              {(p) => {
                return (
                  <div class="p-2 flex items-center justify-between">
                    <div class="text-sm">{p.username || p.twitchLogin || p.tiltifySlug || `User #${p.userId}`}</div>
                    <button
                      class="text-sm px-2 py-1 bg-danger text-white rounded hover:bg-danger-600"
                      onClick={() => onRemoveLocal(p.userId)}
                    >
                      Remove
                    </button>
                  </div>
                )
              }}</For>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default StreamParticipantsSection;

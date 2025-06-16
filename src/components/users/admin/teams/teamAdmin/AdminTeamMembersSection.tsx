
// TeamMembersSection Component
import {type Component, createSignal, For, Show} from "solid-js";
import {useTeamDetail} from "../../providers/TeamDetailsProvider.tsx";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../common/ConfirmationDialog.tsx";

export const AdminTeamMembersSection: Component = () => {
  const {local, removeUser, action} = useTeamDetail();
  const removeConfirmDialog = createModalSignal();
  const [userToRemove, setUserToRemove] = createSignal<number | null>(null);

  const handleRemoveClick = (userId: number) => {
    setUserToRemove(userId);
    removeConfirmDialog.open();
  };

  const handleConfirmRemove = async () => {
    if (userToRemove() !== null) {
      await removeUser(userToRemove()!);
      removeConfirmDialog.close();
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Team Members</h3>
      <Show when={action.removeUser.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{action.removeUser.lastErrorMessage}</p>
        </div>
      </Show>
      <div class="space-y-4">
        {/* Member list */}
        <ul class="divide-y divide-gray-200">
          <For each={local.members}>
            {
              (member) => {
                return (
                  <li class="py-3 flex justify-between items-center">
                    <div>
                      <p class="font-medium">{member.username}</p>
                    </div>
                    {member.userId !== local.ownerId && (
                      <button
                        class="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleRemoveClick(member.userId)}
                        disabled={action.removeUser.actionInProgress}
                      >
                        {action.removeUser.actionInProgress ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </li>
                )
              }
            }
          </For>
        </ul>
      </div>

      <ConfirmationDialog
        isOpen={removeConfirmDialog.isOpen()}
        onOpenChange={removeConfirmDialog.setOpen}
        title="Remove Team Member"
        text="Are you sure you want to remove this user from the team? This action cannot be undone."
        onConfirm={handleConfirmRemove}
        onCancel={removeConfirmDialog.close}
      />
    </div>
  );
};

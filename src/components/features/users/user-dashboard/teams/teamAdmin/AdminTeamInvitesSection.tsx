// TeamInvitesSection Component
import {type Component, createSignal, For, Show} from "solid-js";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {useQuery} from "@tanstack/solid-query";
import {orpc} from "../../../../../../lib/orpc/client.ts";

export const AdminTeamInvitesSection: Component = () => {
  const {cancelInvite, cancelInviteMutation, invites} = useAdminTeamDetail()
  const cancelInviteDialog = createModalSignal();
  const [userToRemove, setUserToRemove] = createSignal<number | null>(null);

  const handleCancelClick = (userId: number) => {
    setUserToRemove(userId);
    cancelInviteDialog.open();
  };

  const handleConfirmCancel = async () => {
    if (userToRemove() !== null) {
      await cancelInvite(userToRemove()!);
      cancelInviteDialog.close();
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Pending Invites</h3>
      <Show when={cancelInviteMutation.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{cancelInviteMutation.failureReason?.message}</p>
        </div>
      </Show>
      <div class="space-y-4">
        {/* Invite list */}
        <ul class="divide-y divide-gray-200">
          <Show when={invites.data}>
            <For each={invites.data?.invites}>
              {(invite) => {
                return (
                  <li class="py-3 flex justify-between items-center">
                    <div>
                      <p class="font-medium">{invite.username}</p>
                    </div>
                    <button
                      class="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleCancelClick(invite.userId)}
                      disabled={cancelInviteMutation.isPending}
                    >
                      {cancelInviteMutation.isPending ? 'Canceling...' : 'Cancel Invite'}
                    </button>
                  </li>
                )
              }}
            </For>
          </Show>
        </ul>

        {/* Invite user form */}
        <div class="mt-4">
          <h4 class="font-medium mb-2">Invite a User</h4>
          <UserSearchInvite/>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={cancelInviteDialog.isOpen()}
        onOpenChange={cancelInviteDialog.setOpen}
        title="Cancel Invitation"
        text="Are you sure you want to cancel this invitation? The user will no longer be able to join the team."
        onConfirm={handleConfirmCancel}
        onCancel={cancelInviteDialog.close}
      />
    </div>
  );
};


// User Search and Invite Component
const UserSearchInvite: Component = () => {
  const [searchText, setSearchText] = createSignal("");
  const {inviteUser, inviteUserMutation} = useAdminTeamDetail()
  const searchQuery = useQuery(() => orpc.public.users.searchByName.queryOptions({
    input: {
      searchTerm: ''
    },
    enabled: () => searchText().length > 0,
  }))

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    setSearchText(query)
  }, 500);

  // Handle invite
  const handleInvite = async (userId: number) => {
    try {
      await inviteUser(userId);
      setSearchText("");
    } catch (err) {
      console.error("Invite error:", err);
      // Error is now handled by the action state
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <Show when={inviteUserMutation.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{inviteUserMutation.failureReason?.message}</p>
        </div>
      </Show>
      <TextField
        value={searchText()}
        onChange={debouncedSearch}
      >
        <TextField.Label class="sr-only">Search Users</TextField.Label>
        <div class="relative">
          <TextField.Input
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search users by username..."
          />
          <Show when={searchQuery.isPending}>
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
            </div>
          </Show>
        </div>
        <Show when={searchQuery.isError}>
          <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
            {searchQuery.error?.message}
          </TextField.ErrorMessage>
        </Show>
      </TextField>

      <Show when={searchQuery.data}>
        <div class="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          <ul class="divide-y divide-gray-200">
            <For each={searchQuery.data!}>
              {(result) => (
                <li class="p-2 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p class="font-medium">{result.tiltifyUsername}</p>
                    <p class="text-sm text-gray-500">{result.twitchUsername}</p>
                  </div>
                  <button
                    class="text-accent hover:text-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleInvite(result.userId)}
                    disabled={inviteUserMutation.isPending}
                  >
                    {inviteUserMutation.isPending ? 'Inviting...' : 'Invite'}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
};

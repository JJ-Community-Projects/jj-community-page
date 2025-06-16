

// TeamInvitesSection Component
import {type Component, createSignal, For, Show} from "solid-js";
import {useTeamDetail} from "../../providers/TeamDetailsProvider.tsx";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../common/ConfirmationDialog.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {actions} from "astro:actions";
import {TextField} from "@kobalte/core/text-field";

export const AdminTeamInvitesSection: Component = () => {
  const {local, cancelInvite, action} = useTeamDetail();
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
      <Show when={action.cancelInvite.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{action.cancelInvite.lastErrorMessage}</p>
        </div>
      </Show>
      <div class="space-y-4">
        {/* Invite list */}
        <ul class="divide-y divide-gray-200">
          <For each={local.invites}>
            {(invite) => {
              return (
                <li class="py-3 flex justify-between items-center">
                  <div>
                    <p class="font-medium">{invite.username}</p>
                  </div>
                  <button
                    class="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleCancelClick(invite.invitedUserId)}
                    disabled={action.cancelInvite.actionInProgress}
                  >
                    {action.cancelInvite.actionInProgress ? 'Canceling...' : 'Cancel Invite'}
                  </button>
                </li>
              )
            }}
          </For>
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
const UserSearchInvite: Component = (props) => {
  const [searchText, setSearchText] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [error, setError] = createSignal("");
  const {local, teamId, removeUser, deleteTeam, inviteUser, updateTeam, action} = useTeamDetail();

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const {data, error} = await actions.users.search(query);
      if (error) {
        console.error("Search error:", error);
        setError("Failed to search for users");
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
        setError("");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An unexpected error occurred");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  // Handle input change
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  // Handle invite
  const handleInvite = async (userId: number) => {
    try {
      await inviteUser(userId);
      setSearchText("");
      setSearchResults([]);
    } catch (err) {
      console.error("Invite error:", err);
      // Error is now handled by the action state
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <Show when={action.inviteUser.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{action.inviteUser.lastErrorMessage}</p>
        </div>
      </Show>
      <TextField
        value={searchText()}
        onChange={handleSearchChange}
      >
        <TextField.Label class="sr-only">Search Users</TextField.Label>
        <div class="relative">
          <TextField.Input
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search users by username..."
          />
          <Show when={isSearching()}>
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
            </div>
          </Show>
        </div>
        <Show when={error()}>
          <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
            {error()}
          </TextField.ErrorMessage>
        </Show>
      </TextField>

      <Show when={searchResults().length > 0}>
        <div class="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          <ul class="divide-y divide-gray-200">
            <For each={searchResults()}>
              {(result) => (
                <li class="p-2 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p class="font-medium">{result.providerName}</p>
                    <p class="text-sm text-gray-500">{result.provider}</p>
                  </div>
                  <button
                    class="text-accent hover:text-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleInvite(result.userId)}
                    disabled={action.inviteUser.actionInProgress}
                  >
                    {action.inviteUser.actionInProgress ? 'Inviting...' : 'Invite'}
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

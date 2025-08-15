import {type Component, createSignal, For, Show} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {ConfirmationDialog} from "../../../../common/dialogs/ConfirmationDialog.tsx";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {CreateTeamDialog} from "./teamAdmin/CreateTeamDialog.tsx";
import {FaSolidChevronLeft} from "solid-icons/fa";
import {orpc} from "../../../../../lib/orpc/client/client.ts";
import {QueryComponent} from "../../../../common/QueryComponent.tsx";
import {useMutation, useQueryClient} from "@tanstack/solid-query";

interface TeamsListProps {
  user: User
}

export const TeamsList: Component<TeamsListProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <TeamsListContent/>
    </UserProvider>
  );
};

const TeamsListContent: Component = () => {
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <TeamsHeader/>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OwnedTeamsList/>
        <MemberTeamsList/>
        <InvitesList/>
      </div>
    </div>
  );
};

const TeamsHeader: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Dashboard</p>
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Your Teams</h2>
          <button
            class="bg-accent hover:bg-accent-400 text-white px-4 py-2 rounded-lg transition-all"
            onClick={() => setIsOpen(true)}
          >
            Create Team
          </button>
        </div>
      </div>

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen}/>
    </div>
  );
};

const OwnedTeamsList: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You Own</h3>

      <QueryComponent
        queryOptions={() => orpc.private.teams.getOwnedTeams.queryOptions()}
        loading={() => (
          <p class="text-gray-500 text-center py-4">Loading teams...</p>
        )}
        error={(error, refetch) => (
          <div class="text-center py-4">
            <p class="text-red-500 mb-2">Failed to load teams</p>
            <button
              onClick={refetch}
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
      >
        {(ownedTeams) => (
          <Show when={ownedTeams.length > 0} fallback={
            <p class="text-gray-500 text-center py-4">You don't own any teams yet.</p>
          }>
            <div class="flex flex-col gap-3">
              <For each={ownedTeams}>
                {(team) => (
                  <a
                    href={`/dashboard/teams/${team.id}`}
                    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <h4 class="font-medium">{team.name}</h4>
                    <p class="text-sm text-gray-500">{team.slug}</p>
                  </a>
                )}
              </For>
            </div>
          </Show>
        )}
      </QueryComponent>
    </div>
  );
};

const MemberTeamsList: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You're In</h3>

      <QueryComponent
        queryOptions={() => orpc.private.teams.getNonOwnedTeams.queryOptions()}
        loading={() => (
          <p class="text-gray-500 text-center py-4">Loading teams...</p>
        )}
        error={(error, refetch) => (
          <div class="text-center py-4">
            <p class="text-red-500 mb-2">Failed to load teams</p>
            <button
              onClick={refetch}
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
      >
        {(memberTeams) => (
          <Show when={memberTeams.length > 0} fallback={
            <p class="text-gray-500 text-center py-4">You're not a member of any teams yet.</p>
          }>
            <div class="flex flex-col gap-3">
              <For each={memberTeams}>
                {(team) => (
                  <a
                    href={`/dashboard/teams/${team.id}`}
                    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <h4 class="font-medium">{team.name}</h4>
                    <p class="text-sm text-gray-500">{team.slug}</p>
                  </a>
                )}
              </For>
            </div>
          </Show>
        )}
      </QueryComponent>
    </div>
  );
};

const InvitesList: Component = () => {
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null);
  const [isAcceptAction, setIsAcceptAction] = createSignal(false);
  const confirmDialog = createModalSignal();
  const client = useQueryClient();
  // Create mutations for accept and reject operations
  const acceptInviteMutation = useMutation(() => orpc.private.teams.acceptInvite.mutationOptions({
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: orpc.private.teams.getUserInvites.key()
      })
    }
  }))
  const rejectInviteMutation = useMutation(() => orpc.private.teams.rejectInvite.mutationOptions({
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: orpc.private.teams.getUserInvites.key()
      })
    }
  }));

  const openConfirmDialog = (teamId: number, isAccept: boolean) => {
    setSelectedTeamId(teamId);
    setIsAcceptAction(isAccept);
    confirmDialog.open();
  };

  const handleConfirm = async () => {
    const teamId = selectedTeamId();
    if (teamId === null) return;

    try {
      if (isAcceptAction()) {
        await acceptInviteMutation.mutateAsync({teamId});
      } else {
        await rejectInviteMutation.mutateAsync({teamId});
      }
      confirmDialog.close();
    } catch (error) {
      console.error(`Failed to ${isAcceptAction() ? 'accept' : 'reject'} invitation:`, error);
      // Error will be displayed in the confirmation dialog
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Team Invitations</h3>

      <QueryComponent
        queryOptions={() => orpc.private.teams.getUserInvites.queryOptions()}
        loading={() => (
          <p class="text-gray-500 text-center py-4">Loading invitations...</p>
        )}
        error={(error, refetch) => (
          <div class="text-center py-4">
            <p class="text-red-500 mb-2">Failed to load invitations</p>
            <button
              onClick={refetch}
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
      >
        {(invites) => (
          <Show when={invites.length > 0} fallback={
            <p class="text-gray-500 text-center py-4">You don't have any team invitations.</p>
          }>
            <div class="flex flex-col gap-3">
              <For each={invites}>
                {(invite) => (
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="mb-2">
                      <div class="text-sm text-gray-500">You've been invited to join:</div>
                      <h4 class="font-medium">{invite.name}</h4>
                    </div>
                    <div class="flex gap-2">
                      <button
                        onClick={() => openConfirmDialog(invite.teamId, true)}
                        class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => openConfirmDialog(invite.teamId, false)}
                        class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        )}
      </QueryComponent>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen()}
        onOpenChange={confirmDialog.setOpen}
        title={isAcceptAction() ? "Accept Team Invitation" : "Reject Team Invitation"}
        text={
          isAcceptAction()
            ? acceptInviteMutation.error
              ? `Error: ${acceptInviteMutation.error.message}`
              : "Are you sure you want to accept this invitation?"
            : rejectInviteMutation.error
              ? `Error: ${rejectInviteMutation.error.message}`
              : "Are you sure you want to reject this invitation?"
        }
        onConfirm={handleConfirm}
        onCancel={confirmDialog.close}
      />

      {/* Display loading indicators for the buttons in the invite list */}
      <Show when={acceptInviteMutation.isPending || rejectInviteMutation.isPending}>
        <div class="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-xl">
            <div class="flex items-center gap-2">
              <div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <span>{isAcceptAction() ? "Accepting invitation..." : "Rejecting invitation..."}</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

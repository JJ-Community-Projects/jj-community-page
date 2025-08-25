import {type Component, createSignal, For, Show, Match, Switch} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {ConfirmationDialog} from "../../../../common/dialogs/ConfirmationDialog.tsx";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {CreateTeamDialog} from "./teamAdmin/CreateTeamDialog.tsx";
import {FaSolidChevronLeft, FaSolidPlus, FaSolidUsers, FaSolidCrown, FaSolidEnvelope, FaSolidUserGroup, FaSolidArrowUpRightFromSquare} from "solid-icons/fa";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {QueryComponent} from "../../../../common/QueryComponent.tsx";
import {QueryClientProvider, useMutation, useQueryClient} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";

interface TeamsListProps {
  user: User
}

export const TeamsList: Component<TeamsListProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <TeamsListContent/>
      </UserProvider>
    </QueryClientProvider>
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
    <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
      <div class="~p-4/8">
        <div class="flex flex-col gap-4">
          <div>
            <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center transition-colors duration-200">
              <FaSolidChevronLeft class="w-4 h-4" />
              <span class="text-sm font-medium">Back to Dashboard</span>
            </a>
          </div>
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">Your Teams</h1>
            <button
              class="
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                bg-accent hover:bg-accent-600 text-white font-medium
                focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white
                outline-none shadow-sm hover:shadow-md active:scale-95
              "
              onClick={() => setIsOpen(true)}
            >
              <FaSolidPlus class="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen}/>
    </div>
  );
};

const OwnedTeamsList: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
      <div class="~p-4/8">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaSolidCrown class="w-5 h-5 text-primary" />
          Teams You Own
        </h3>

        <QueryComponent
          queryOptions={() => orpcPrivate.teamsSSE.getUserTeamsAdminSSE.experimental_liveOptions()}
          loading={() => (
            <div class="space-y-3">
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="bg-danger-50 rounded-xl p-6 border border-danger-200 text-center">
              <div class="flex items-center justify-center gap-3 text-danger-600 mb-3">
                <div>
                  <p class="font-semibold text-sm">Failed to load teams</p>
                  <p class="text-xs opacity-90">{error.message || "Unknown error occurred"}</p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="
                  px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600
                  focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white
                  transition-all duration-200 outline-none
                "
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => (
            <Show when={result.teams.length > 0} fallback={
              <div class="flex flex-col items-center justify-center py-12 px-4">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <FaSolidCrown class="w-8 h-8 text-white" />
                </div>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">No teams owned</h4>
                <p class="text-gray-600 text-center max-w-md leading-relaxed">
                  You don't own any teams yet. Create your first team to get started.
                </p>
              </div>
            }>
              <div class="space-y-4">
                <For each={result.teams}>
                  {(team) => (
                    <a
                      href={`/dashboard/teams/${team.id}`}
                      class="
                        group block bg-white rounded-xl p-4 shadow-md border-2 border-primary-200
                        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300
                        focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white outline-none
                      "
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                          <h4 class="font-semibold text-gray-900 text-sm mb-1 truncate group-hover:text-primary transition-colors">
                            {team.name}
                          </h4>
                          <p class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                            {team.slug}
                          </p>
                        </div>
                        <div class="flex items-center gap-2 ml-3">
                          <div class="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                            <FaSolidCrown class="w-3 h-3" />
                            <span class="text-xs font-medium">Owner</span>
                          </div>
                          <FaSolidArrowUpRightFromSquare class="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* Subtle hover effect */}
                      <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-primary-500"></div>
                    </a>
                  )}
                </For>
              </div>
            </Show>
          )}
        </QueryComponent>
      </div>
    </div>
  );
};

const MemberTeamsList: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
      <div class="~p-4/8">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaSolidUsers class="w-5 h-5 text-accent" />
          Teams You're In
        </h3>

        <QueryComponent
          queryOptions={() => orpcPrivate.teamsSSE.getUserTeamsSSE.experimental_liveOptions()}
          loading={() => (
            <div class="space-y-3">
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="bg-danger-50 rounded-xl p-6 border border-danger-200 text-center">
              <div class="flex items-center justify-center gap-3 text-danger-600 mb-3">
                <div>
                  <p class="font-semibold text-sm">Failed to load teams</p>
                  <p class="text-xs opacity-90">{error.message || "Unknown error occurred"}</p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="
                  px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600
                  focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white
                  transition-all duration-200 outline-none
                "
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => (
            <Show when={result.teams.length > 0} fallback={
              <div class="flex flex-col items-center justify-center py-12 px-4">
                <div class="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <FaSolidUsers class="w-8 h-8 text-white" />
                </div>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">No team memberships</h4>
                <p class="text-gray-600 text-center max-w-md leading-relaxed">
                  You're not a member of any teams yet. Accept team invitations to join teams.
                </p>
              </div>
            }>
              <div class="space-y-4">
                <For each={result.teams}>
                  {(team) => (
                    <a
                      href={`/dashboard/teams/${team.id}`}
                      class="
                        group block bg-white rounded-xl p-4 shadow-md border-2 border-accent-100
                        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent-200
                        focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white outline-none
                      "
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                          <h4 class="font-semibold text-gray-900 text-sm mb-1 truncate group-hover:text-accent transition-colors">
                            {team.name}
                          </h4>
                          <p class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                            {team.slug}
                          </p>
                        </div>
                        <div class="flex items-center gap-2 ml-3">
                          <div class="flex items-center gap-1 bg-accent-100 text-accent-700 px-2 py-1 rounded-full">
                            <FaSolidUserGroup class="w-3 h-3" />
                            <span class="text-xs font-medium">Member</span>
                          </div>
                          <FaSolidArrowUpRightFromSquare class="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors" />
                        </div>
                      </div>

                      {/* Subtle hover effect */}
                      <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-accent-500"></div>
                    </a>
                  )}
                </For>
              </div>
            </Show>
          )}
        </QueryComponent>
      </div>
    </div>
  );
};

const InvitesList: Component = () => {
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null);
  const [isAcceptAction, setIsAcceptAction] = createSignal(false);
  const confirmDialog = createModalSignal();
  const client = useQueryClient();
  // Create mutations for accept and reject operations
  const acceptInviteMutation = useMutation(() => orpcPrivate.teams.acceptInvite.mutationOptions({
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: orpcPrivate.teams.getUserInvites.key()
      })
    }
  }))
  const rejectInviteMutation = useMutation(() => orpcPrivate.teams.rejectInvite.mutationOptions({
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: orpcPrivate.teams.getUserInvites.key()
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
    <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
      <div class="~p-4/8">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaSolidEnvelope class="w-5 h-5 text-warning" />
          Team Invitations
        </h3>

        <QueryComponent
          // queryOptions={() => orpcPrivate.teams.getUserInvites.queryOptions()}
          queryOptions={() => orpcPrivate.teamsSSE.getUserInvitesSSE.experimental_liveOptions()}
          loading={() => (
            <div class="space-y-3">
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
              <div class="animate-pulse bg-gray-200 rounded-xl h-20 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="bg-danger-50 rounded-xl p-6 border border-danger-200 text-center">
              <div class="flex items-center justify-center gap-3 text-danger-600 mb-3">
                <div>
                  <p class="font-semibold text-sm">Failed to load invitations</p>
                  <p class="text-xs opacity-90">{error.message || "Unknown error occurred"}</p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="
                  px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600
                  focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white
                  transition-all duration-200 outline-none
                "
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => (
            <Show when={result.invites.length > 0} fallback={
              <div class="flex flex-col items-center justify-center py-12 px-4">
                <div class="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <FaSolidEnvelope class="w-8 h-8 text-white" />
                </div>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">No pending invitations</h4>
                <p class="text-gray-600 text-center max-w-md leading-relaxed">
                  You don't have any team invitations at the moment. Team owners can invite you to join their teams.
                </p>
              </div>
            }>
              <div class="space-y-4">
                <For each={result.invites}>
                  {(invite) => (
                    <div class="bg-white rounded-xl p-4 shadow-md border-2 border-warning-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                      <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <div class="flex items-center gap-1 bg-warning-100 text-warning-700 px-2 py-1 rounded-full">
                              <FaSolidEnvelope class="w-3 h-3" />
                              <span class="text-xs font-medium">Pending</span>
                            </div>
                          </div>
                          <p class="text-xs text-gray-600 mb-1">You've been invited to join:</p>
                          <h4 class="font-semibold text-gray-900 text-sm truncate">{invite.name}</h4>
                        </div>

                        <div class="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => openConfirmDialog(invite.teamId, true)}
                            disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                            class="
                              flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200
                              bg-success text-white hover:bg-success-600
                              focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-white
                              outline-none hover:shadow-sm active:scale-95 text-xs font-medium
                              disabled:opacity-50 disabled:cursor-not-allowed
                            "
                          >
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => openConfirmDialog(invite.teamId, false)}
                            disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                            class="
                              flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200
                              bg-danger text-white hover:bg-danger-600
                              focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white
                              outline-none hover:shadow-sm active:scale-95 text-xs font-medium
                              disabled:opacity-50 disabled:cursor-not-allowed
                            "
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          )}
        </QueryComponent>
      </div>

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

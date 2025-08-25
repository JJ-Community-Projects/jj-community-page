import {type Component, createSignal, For, Match, Show, Switch} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import {TeamDetailsProvider, useTeamDetails} from "./TeamDetailsProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {Dialog} from "@kobalte/core/dialog";
import {createModalSignal, type ModalSignal} from "../../../../../lib/createModalSignal.ts";
import {FaSolidChevronLeft, FaSolidUsers, FaSolidCrown, FaSolidArrowUpRightFromSquare, FaSolidUserGroup} from "solid-icons/fa";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/solid-query";

interface TeamDetailProps {
  user: User;
  teamId: number;
}

export const TeamDetail: Component<TeamDetailProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <TeamDetailsProvider teamId={props.teamId}>
          <TeamDetailContent teamId={props.teamId}/>
        </TeamDetailsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

const TeamDetailContent: Component<{ teamId: number }> = (props) => {
  const {team, members, leaveTeam, teamId} = useTeamDetails();

  const leaveDialog = createModalSignal();

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam(teamId);
      // Redirect to teams list page after leaving
      window.location.href = `/dashboard/teams`;
    } catch (e) {
      console.error("Error leaving team:", e);
      // setError("Failed to leave team");
    }
  };

  const membersList = () => members.data?.invites ?? [];
  const hasMembers = () => membersList().length > 0;
  const isLoading = () => members.isLoading;

  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Team Header */}
      <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div class="~p-4/8">
          <div class="flex flex-col gap-4">
            <div>
              <a href={`/dashboard/teams`} class="text-primary hover:underline flex flex-row gap-1 items-center transition-colors duration-200">
                <FaSolidChevronLeft class="w-4 h-4" />
                <span class="text-sm font-medium">Back to Teams</span>
              </a>
            </div>

            <div class="flex justify-between items-start">
              <div class="flex-1 space-y-3">
                <div>
                  <h1 class="text-2xl font-bold text-neutral-800 mb-2">{team.data?.name}</h1>
                  <a
                    class="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1 transition-colors duration-200"
                    href={`/teams/${team.data?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    jj.ostof.dev/teams/{team.data?.slug}
                    <FaSolidArrowUpRightFromSquare class="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                class="
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                  bg-danger-50 hover:bg-danger-100 text-danger-700 hover:text-danger-800
                  border border-danger-200 hover:border-danger-300
                  focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white
                  outline-none hover:shadow-md active:scale-95
                "
                onClick={leaveDialog.open}
              >
                <span class="text-sm font-medium">Leave Team</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div class="~p-4/8 space-y-6">
          {/* Team Information */}
          <div class="border-b border-neutral-200 pb-6">
            <h3 class="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <FaSolidUserGroup class="w-5 h-5 text-neutral-600" />
              Team Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-neutral-600">Team Name</h4>
                <p class="text-neutral-800 font-medium">{team.data?.name}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-neutral-600">Team Slug</h4>
                <p class="text-neutral-800 font-mono text-sm bg-neutral-100 px-3 py-1 rounded-lg inline-block">
                  {team.data?.slug}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <h4 class="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <FaSolidUsers class="w-4 h-4 text-primary" />
                Team Members
              </h4>
              {hasMembers() && (
                <div class="bg-gradient-to-r from-primary-100 to-primary-200 px-3 py-1 rounded-full">
                  <span class="text-primary-700 text-xs font-medium">
                    {membersList().length} member{membersList().length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <Switch>
              <Match when={isLoading()}>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
                  <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
                  <div class="animate-pulse bg-neutral-200 rounded-xl h-16 shadow-sm"></div>
                </div>
              </Match>

              <Match when={!hasMembers()}>
                <div class="flex flex-col items-center justify-center py-12 px-4">
                  <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <FaSolidUsers class="w-8 h-8 text-white" />
                  </div>
                  <h4 class="text-xl font-semibold text-neutral-700 mb-2">No members yet</h4>
                  <p class="text-neutral-600 text-center max-w-md leading-relaxed">
                    This team doesn't have any members currently.
                  </p>
                </div>
              </Match>

              <Match when={hasMembers()}>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
                  <For each={membersList()}>
                    {(member) => (
                      <div class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-primary-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200">
                        <div class="flex items-center gap-3 flex-1">
                          {/* Avatar placeholder */}
                          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
                            <span class="text-white font-semibold text-sm">
                              {(member.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>

                          {/* Member info */}
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                              <p class="font-semibold text-neutral-700 text-sm block truncate">
                                {member.username || 'Unknown User'}
                              </p>
                              {member.userId === team.data?.ownerId && (
                                <div class="flex items-center gap-1 bg-warning-100 text-warning-700 px-2 py-1 rounded-full">
                                  <FaSolidCrown class="w-3 h-3" />
                                  <span class="text-xs font-medium">Owner</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subtle hover effect */}
                        <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-primary-500"></div>
                      </div>
                    )}
                  </For>
                </div>
              </Match>
            </Switch>
          </div>
        </div>
      </div>

      {/* Leave Team Dialog */}
      <LeaveTeamDialog
        modalSignal={leaveDialog}
        onConfirm={handleLeaveTeam}
        teamName={team.data?.name || ""}
      />
    </div>
  );
};

// Leave Team Dialog Component
const LeaveTeamDialog: Component<{
  modalSignal: ModalSignal;
  onConfirm: () => Promise<void>;
  teamName: string;
}> = (props) => {
  const [isLeaving, setIsLeaving] = createSignal(false);

  const handleConfirm = async () => {
    setIsLeaving(true);
    try {
      await props.onConfirm();
      props.modalSignal.close();
    } catch (e) {
      console.error("Error in leave confirmation:", e);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog open={props.modalSignal.isOpen()} onOpenChange={props.modalSignal.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <Dialog.Title class="text-xl font-bold mb-4">Leave Team</Dialog.Title>
            <Dialog.Description class="text-neutral-600 mb-4">
              Are you sure you want to leave the team "{props.teamName}"? You will lose access to all team resources.
            </Dialog.Description>

            <div class="flex justify-end gap-2 mt-4">
              <button
                type="button"
                class="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50"
                onClick={props.modalSignal.close}
                disabled={isLeaving()}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={isLeaving()}
              >
                {isLeaving() ? "Leaving..." : "Leave Team"}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

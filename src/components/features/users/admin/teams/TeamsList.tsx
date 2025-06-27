import {type Component, createSignal, For, Show} from "solid-js";
import {UserProvider, useUser} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {TextField} from "@kobalte/core/text-field";
import {Dialog} from "@kobalte/core/dialog";
import {createStore} from "solid-js/store";
import {debounce} from "@solid-primitives/scheduled";
import {ConfirmationDialog} from "../../../../common/dialogs/ConfirmationDialog.tsx";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {CreateTeamDialog} from "./teamAdmin/CreateTeamDialog.tsx";
import {FaSolidChevronLeft} from "solid-icons/fa";

interface TeamsListProps {
  user: User
}

export const TeamsList: Component<TeamsListProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <TeamsListContent />
    </UserProvider>
  );
};

const TeamsListContent: Component = () => {
  const {local} = useUser()
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <TeamsHeader />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OwnedTeamsList />
        <MemberTeamsList />
        <InvitesList />
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
          <a href={`/admin`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Admin</p>
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

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
};

const OwnedTeamsList: Component = () => {
  const {local, user} = useUser();

  const ownedTeams = () => {
    return local.teamMembers.filter((m) => m.ownerId === user.id);
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You Own</h3>

      <Show when={ownedTeams().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You don't own any teams yet.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={ownedTeams()}>
            {(team) => (
              <a
                href={`/admin/teams/${team.id}`}
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 class="font-medium">{team.name}</h4>
                <p class="text-sm text-gray-500">{team.slug}</p>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const MemberTeamsList: Component = () => {
  const {local, user} = useUser();

  // Filter teams where the user is a member but not the owner
  const memberTeams = () => {
    return local.teamMembers.filter((m) => m.ownerId !== user.id);
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You're In</h3>

      <Show when={memberTeams().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You're not a member of any teams yet.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={memberTeams()}>
            {(team) => (
              <a
                href={`/admin/teams/${team.id}`}
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 class="font-medium">{team.name}</h4>
                <p class="text-sm text-gray-500">{team.slug}</p>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const InvitesList: Component = () => {
  const {local, acceptTeamInvite, rejectTeamInvite, action} = useUser();
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null);
  const [isAcceptAction, setIsAcceptAction] = createSignal(false);
  const confirmDialog = createModalSignal();

  // Get team invites for the user
  const invites = () => local.invites || [];

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
        await acceptTeamInvite(teamId);
      } else {
        await rejectTeamInvite(teamId);
      }
      confirmDialog.close();
    } catch (error) {
      console.error(`Failed to ${isAcceptAction() ? 'accept' : 'reject'} invitation:`, error);
      // Error is already handled by the action state
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Team Invitations</h3>

      <Show when={invites().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You don't have any team invitations.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={invites()}>
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

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen()}
        onOpenChange={confirmDialog.setOpen}
        title={isAcceptAction() ? "Accept Team Invitation" : "Reject Team Invitation"}
        text={
          isAcceptAction()
            ? action.acceptTeamInvite.lastErrorMessage
              ? `Error: ${action.acceptTeamInvite.lastErrorMessage}`
              : "Are you sure you want to accept this invitation?"
            : action.rejectTeamInvite.lastErrorMessage
              ? `Error: ${action.rejectTeamInvite.lastErrorMessage}`
              : "Are you sure you want to reject this invitation?"
        }
        onConfirm={handleConfirm}
        onCancel={confirmDialog.close}
      />

      {/* Display loading indicators for the buttons in the invite list */}
      <Show when={action.acceptTeamInvite.actionInProgress || action.rejectTeamInvite.actionInProgress}>
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

import {type Component, createSignal, For} from "solid-js";
import {UserProvider, useUser} from "../providers/UserProvider.tsx";
import {TeamDetailsProvider, useTeamDetail} from "../providers/TeamDetailsProvider.tsx";
import type {User} from "../../../lib/auth/User.ts";
import {Dialog} from "@kobalte/core/dialog";
import {createModalSignal, type ModalSignal} from "../../../lib/createModalSignal";
import {actions} from "astro:actions";

interface TeamDetailProps {
  user: User;
  teamId: number;
}

export const TeamDetail: Component<TeamDetailProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <TeamDetailsProvider teamId={props.teamId} user={props.user}>
        <TeamDetailContent teamId={props.teamId}/>
      </TeamDetailsProvider>
    </UserProvider>
  );
};

const TeamDetailContent: Component<{ teamId: number }> = (props) => {
  const {user} = useUser();
  const {local, teamId, removeUser} = useTeamDetail();

  const leaveDialog = createModalSignal();


  const handleLeaveTeam = async () => {
    try {
      // Use the leaveTeam action for non-owner team members
      const result = await actions.teams.leaveTeam(teamId);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to leave team');
      }
      // Redirect to teams list page after leaving
      window.location.href = `/${user.tiltifyName}/admin/teams`;
    } catch (e) {
      console.error("Error leaving team:", e);
      // setError("Failed to leave team");
    }
  };

  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Team Header */}
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <a href={`/${user.tiltifyName}/admin/teams`} class="text-primary hover:underline">
              &larr; Back to Teams
            </a>
            <h2 class="text-xl font-bold">{local.name}</h2>
          </div>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
            onClick={leaveDialog.open}>
            Leave Team
          </button>
        </div>
      </div>

      {/* Team Content */}
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h3 class="text-lg font-bold mb-4">Team Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-700">Team Name</h4>
            <p>{local.name}</p>
          </div>
          <div>
            <h4 class="font-medium text-gray-700">Team Slug</h4>
            <p>{local.slug}</p>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h3 class="text-lg font-bold mb-4">Team Members</h3>
        <div class="space-y-4">
          {/* Member list */}
          <ul class="divide-y divide-gray-200">
            <For each={local.members}>
              {
                ((member) => (
                  <li class="py-3 flex justify-between items-center">
                    <div>
                      <p class="font-medium">{member.username}</p>
                    </div>
                    {member.userId === local.ownerId && (
                      <span class="text-accent text-sm">Owner</span>
                    )}
                  </li>
                ))
              }
            </For>
          </ul>
        </div>
      </div>

      {/* Leave Team Dialog */}
      <LeaveTeamDialog
        modalSignal={leaveDialog}
        onConfirm={handleLeaveTeam}
        teamName={local.name}
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
            <Dialog.Description class="text-gray-600 mb-4">
              Are you sure you want to leave the team "{props.teamName}"? You will lose access to all team resources.
            </Dialog.Description>

            <div class="flex justify-end gap-2 mt-4">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={props.modalSignal.close}
                disabled={isLeaving()}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

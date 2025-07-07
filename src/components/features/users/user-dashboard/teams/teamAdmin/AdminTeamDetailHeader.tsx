import type {Component} from "solid-js";
import {useTeamDetail} from "../../providers/TeamDetailsProvider.tsx";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import {FaSolidChevronLeft} from "solid-icons/fa";

export const AdminTeamDetailHeader: Component = () => {
  const {
    local,
    deleteTeam,
    action,
    user
  } = useTeamDetail();

  const showDeleteDialog = createModalSignal();

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam();
      showDeleteDialog.close();
      // Redirect to teams list or another appropriate page
      window.location.href = `/dashboard/teams`;
    } catch (error) {
      console.error("Error deleting team:", error);
      // Error is handled by the action state
    }
  };

  return (
    <>
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex justify-between items-center">
          <div class="flex flex-col">
            <a href={`/dashboard/teams`} class="text-primary hover:underline flex flex-row gap-1 items-center">
              <FaSolidChevronLeft/><p>Back to Teams</p>
            </a>
            <h1 class="text-2xl font-bold">Team Details</h1>
            <a class="text-primary" href={`/teams/${local.slug}`}>jj.ostof.dev/teams/${local.slug}</a>
          </div>

          <div class="flex gap-2">
            <button
              onClick={showDeleteDialog.open}
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
              disabled={action.deleteTeam?.actionInProgress}
            >
              {action.deleteTeam?.actionInProgress ? 'Deleting...' : 'Delete Team'}
            </button>
          </div>
        </div>

        {/* Informational text */}
        <div class="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <p>Manage your team details, members, and invites from this page. Changes to team properties are saved when you click the Save button.</p>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog.isOpen()}
        onOpenChange={showDeleteDialog.setOpen}
        title="Delete Team"
        text="Are you sure you want to delete this team? This action cannot be undone."
        onConfirm={handleDeleteTeam}
        onCancel={showDeleteDialog.close}
      />
    </>
  )
}

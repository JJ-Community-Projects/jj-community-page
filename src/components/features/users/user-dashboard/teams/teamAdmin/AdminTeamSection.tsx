import {type Component, Show} from "solid-js";
import {AdminTeamSettingsSection} from "./AdminTeamSettingsSection.tsx";
import {AdminTeamMembersSection} from "./AdminTeamMembersSection.tsx";
import {AdminTeamInvitesSection} from "./AdminTeamInvitesSection.tsx";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import {FaSolidTrash, FaSolidCircleInfo} from "solid-icons/fa";

/**
 * AdminTeamSection Component
 *
 * Main section for team administration functionality.
 * Enhanced with modern design, glass-morphism effects, and improved user experience.
 *
 * Features:
 * - Team settings management with real-time validation
 * - Team member management with invite/remove functionality
 * - Team invitations management
 * - Team deletion with confirmation
 * - Visual feedback for all operations
 * - Responsive design with fluid typography
 * - Comprehensive accessibility support
 *
 * Uses AdminTeamDetailsProvider context for data management to avoid prop drilling.
 * All child components access data directly from the provider context.
 */
export const AdminTeamSection: Component = () => {
  const {
    team,
    deleteTeam,
    deleteTeamMutation
  } = useAdminTeamDetail();

  const showDeleteDialog = createModalSignal();

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam();
      showDeleteDialog.close();
      // Redirect to teams list
      window.location.href = `/dashboard/teams`;
    } catch (error) {
      console.error("Error deleting team:", error);
      // Error is handled by the mutation state
    }
  };

  return (
    <>
      <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div class="~p-4/8 space-y-6">

          {/* Team Information Header */}
          <div class="border-b border-gray-200 pb-6">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Team Management</h3>
                <Show when={team.data}>
                  <div class="space-y-1">
                    <p class="text-sm text-gray-600">
                      <span class="font-medium">Team:</span> {team.data?.name}
                    </p>
                    <a
                      class="text-primary hover:underline text-sm font-medium"
                      href={`/teams/${team.data?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      jj.ostof.dev/teams/{team.data?.slug} ↗
                    </a>
                  </div>
                </Show>
              </div>

              {/* Delete Team Button */}
              <button
                onClick={showDeleteDialog.open}
                class="
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                  bg-danger-50 hover:bg-danger-100 text-danger-700 hover:text-danger-800
                  border border-danger-200 hover:border-danger-300
                  focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white
                  outline-none hover:shadow-md active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                disabled={deleteTeamMutation.isPending}
                aria-label="Delete team"
              >
                <FaSolidTrash class="w-4 h-4" />
                <span class="text-sm font-medium">
                  {deleteTeamMutation.isPending ? 'Deleting...' : 'Delete Team'}
                </span>
              </button>
            </div>

            {/* Informational notice */}
            <div class="mt-4 p-3 bg-accent-50 text-accent-700 rounded-lg border border-accent-200">
              <div class="flex items-start gap-2">
                <FaSolidCircleInfo class="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p class="text-sm">
                  Manage your team details, members, and invites from this page.
                  Changes to team properties are saved when you click the Save button.
                </p>
              </div>
            </div>
          </div>

          {/* Team Settings Section */}
          <AdminTeamSettingsSection />

          {/* Team Members Section */}
          <AdminTeamMembersSection />

          {/* Team Invites Section */}
          <AdminTeamInvitesSection />

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
  );
};

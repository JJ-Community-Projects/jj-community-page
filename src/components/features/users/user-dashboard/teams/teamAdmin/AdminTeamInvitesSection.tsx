import {type Component, createSignal, For, Match, Show, Switch} from "solid-js";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {AdminTeamInviteSearchInput} from "./AdminTeamInviteSearchInput.tsx";
import {FaSolidEnvelope, FaSolidCircleExclamation, FaSolidXmark, FaSolidClock} from "solid-icons/fa";

interface Invite {
  userId: number;
  username: string;
}

interface InviteListItemProps {
  invite: Invite;
}

const InviteListItem: Component<InviteListItemProps> = (props) => {
  const {cancelInvite, cancelInviteMutation} = useAdminTeamDetail();
  const cancelInviteDialog = createModalSignal();

  const handleCancelClick = () => {
    cancelInviteDialog.open();
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelInvite(props.invite.userId);
      cancelInviteDialog.close();
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  return (
    <>
      <div class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-warning-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-warning-200">
        <div class="flex items-center gap-3 flex-1">
          {/* Avatar placeholder */}
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-warning-400 to-warning-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <span class="text-white font-semibold text-sm">
              {(props.invite.username || 'U')[0].toUpperCase()}
            </span>
          </div>

          {/* Invite info */}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-gray-800 text-sm block truncate">
                {props.invite.username || 'Unknown User'}
              </p>
              <div class="flex items-center gap-1 bg-warning-100 text-warning-700 px-2 py-1 rounded-full">
                <FaSolidClock class="w-3 h-3" />
                <span class="text-xs font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={cancelInviteMutation.isPending}
            class="
              flex-shrink-0 p-2 rounded-full transition-all duration-200
              hover:bg-danger-100 focus:bg-danger-100
              group-hover:opacity-100 opacity-70
              focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white outline-none
              hover:scale-110 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label={`Cancel invitation for ${props.invite.username}`}
            title="Cancel invitation"
          >
            <FaSolidXmark class="w-4 h-4 text-danger-500 hover:text-danger-600" />
          </button>
        </div>

        {/* Subtle hover effect */}
        <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-warning-500"></div>
      </div>

      <ConfirmationDialog
        isOpen={cancelInviteDialog.isOpen()}
        onOpenChange={cancelInviteDialog.setOpen}
        title="Cancel Invitation"
        text={`Are you sure you want to cancel the invitation for ${props.invite.username}? They will no longer be able to join the team using this invitation.`}
        onConfirm={handleConfirmCancel}
        onCancel={cancelInviteDialog.close}
      />
    </>
  );
};

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidEnvelope class="w-8 h-8 text-white" />
    </div>
    <h4 class="text-xl font-semibold text-gray-800 mb-2">No pending invites</h4>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      You don't have any pending team invitations. Use the search above to find and invite users to join your team.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
  </div>
);

/**
 * AdminTeamInvitesSection Component
 *
 * Manages team invitations with user search and invite management functionality.
 * Enhanced with modern design, invite cards, and proper loading/empty states.
 */
export const AdminTeamInvitesSection: Component = () => {
  const {invites, cancelInviteMutation} = useAdminTeamDetail();

  const invitesList = () => invites.data?.invites ?? [];
  const hasInvites = () => invitesList().length > 0;
  const isLoading = () => invites.isLoading;
  const hasError = () => !!invites.error;

  return (
    <div class="space-y-6">
      {/* User Search and Invite Section */}
      <AdminTeamInviteSearchInput />

      {/* Pending Invites Section */}
      <div class="space-y-4">
        {/* Section Header */}
        <div class="flex items-center gap-3">
          <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FaSolidEnvelope class="w-4 h-4 text-warning-600" />
            Pending Invites
          </h4>
          {hasInvites() && (
            <div class="bg-gradient-to-r from-warning-100 to-warning-200 px-3 py-1 rounded-full">
              <span class="text-warning-700 text-xs font-medium">
                {invitesList().length} pending
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        <Show when={cancelInviteMutation.isError}>
          <div class="bg-danger-50 rounded-xl p-4 border border-danger-200">
            <div class="flex items-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
              <p class="text-sm font-medium">{cancelInviteMutation.failureReason?.message || "Failed to cancel invitation"}</p>
            </div>
          </div>
        </Show>

        <Switch>
          <Match when={isLoading()}>
            <LoadingSkeleton />
          </Match>

          <Match when={hasError()}>
            <div class="bg-danger-50 rounded-xl p-6 border border-danger-200">
              <div class="flex items-center justify-center gap-3 text-danger-600">
                <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0" />
                <div>
                  <p class="font-semibold text-sm">Error loading invites</p>
                  <p class="text-xs opacity-90">{invites.error?.message || "Unknown error occurred"}</p>
                </div>
              </div>
            </div>
          </Match>

          <Match when={!hasInvites()}>
            <EmptyState />
          </Match>

          <Match when={hasInvites()}>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
              <For each={invitesList()}>
                {(invite) => (
                  <InviteListItem invite={invite} />
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

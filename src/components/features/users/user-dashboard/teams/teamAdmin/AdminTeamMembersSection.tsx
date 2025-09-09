import {type Component, For, Match, Show, Switch} from "solid-js";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import {FaSolidCircleExclamation, FaSolidCrown, FaSolidUsers, FaSolidXmark} from "solid-icons/fa";

interface Member {
  userId: number;
  username: string;
}

interface MemberListItemProps {
  member: Member;
  isOwner: boolean;
}

const MemberListItem: Component<MemberListItemProps> = (props) => {
  const {removeUser, removeUserMutation, team} = useAdminTeamDetail();
  const removeConfirmDialog = createModalSignal();

  const handleRemoveClick = () => {
    removeConfirmDialog.open();
  };

  const handleConfirmRemove = async () => {
    try {
      await removeUser(props.member.userId);
      removeConfirmDialog.close();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <>
      <div class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-primary-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200">
        <div class="flex items-center gap-3 flex-1">
          {/* Avatar placeholder */}
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <span class="text-white font-semibold text-sm">
              {(props.member.username || 'U')[0].toUpperCase()}
            </span>
          </div>

          {/* Member info */}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-gray-800 text-sm block truncate">
                {props.member.username || 'Unknown User'}
              </p>
              {props.isOwner && (
                <div class="flex items-center gap-1 bg-warning-100 text-warning-700 px-2 py-1 rounded-full">
                  <FaSolidCrown class="w-3 h-3" />
                  <span class="text-xs font-medium">Owner</span>
                </div>
              )}
            </div>
          </div>

          {/* Remove button (only for non-owners) */}
          {!props.isOwner && (
            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={removeUserMutation.isPending}
              class="
                flex-shrink-0 p-2 rounded-full transition-all duration-200
                hover:bg-danger-100 focus:bg-danger-100
                group-hover:opacity-100 opacity-70
                focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white outline-none
                hover:scale-110 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label={`Remove ${props.member.username} from team`}
              title="Remove member"
            >
              <FaSolidXmark class="w-4 h-4 text-danger-500 hover:text-danger-600" />
            </button>
          )}
        </div>

        {/* Subtle hover effect */}
        <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-primary-500"></div>
      </div>

      <ConfirmationDialog
        isOpen={removeConfirmDialog.isOpen()}
        onOpenChange={removeConfirmDialog.setOpen}
        title="Remove Team Member"
        text={`Are you sure you want to remove ${props.member.username} from the team? This action cannot be undone.`}
        onConfirm={handleConfirmRemove}
        onCancel={removeConfirmDialog.close}
      />
    </>
  );
};

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidUsers class="w-8 h-8 text-white" />
    </div>
    <h4 class="text-xl font-semibold text-gray-800 mb-2">No members yet</h4>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      Your team doesn't have any members yet. Send invitations to other users to build your team.
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
 * AdminTeamMembersSection Component
 *
 * Displays and manages team members with removal functionality.
 * Enhanced with modern design, member cards, and proper loading/empty states.
 */
export const AdminTeamMembersSection: Component = () => {
  const {team, members, removeUserMutation} = useAdminTeamDetail();

  const membersList = () => members.data?.members ?? [];
  const hasMembers = () => membersList().length > 0;
  const isLoading = () => members.isLoading;
  const hasError = () => !!members.error;

  return (
    <div class="space-y-6">
      {/* Section Header */}
      <div class="flex items-center gap-3">
        <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
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

      {/* Error Message */}
      <Show when={removeUserMutation.isError}>
        <div class="bg-danger-50 rounded-xl p-4 border border-danger-200">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0" />
            <p class="text-sm font-medium">{removeUserMutation.failureReason?.message || "Failed to remove member"}</p>
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
                <p class="font-semibold text-sm">Error loading members</p>
                <p class="text-xs opacity-90">{members.error?.message || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasMembers()}>
          <EmptyState />
        </Match>

        <Match when={hasMembers()}>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
            <For each={membersList()}>
              {(member) => (
                <MemberListItem
                  member={member}
                  isOwner={member.userId === team.data?.ownerId}
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

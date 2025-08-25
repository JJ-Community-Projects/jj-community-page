import {type Component, For, Match, Show, Switch} from "solid-js";
import {useFriends} from "./UserFriendsProvider.tsx";
import {FaSolidCircleExclamation, FaSolidUsers, FaSolidXmark} from "solid-icons/fa";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../common/dialogs/ConfirmationDialog.tsx";

interface Friend {
  userId: number;
  username: string;
  profileImage: string;
  twitchLogin: string | null;
}

interface FriendListItemProps {
  friend: Friend;
}

const FriendListItem: Component<FriendListItemProps> = (props) => {
  const {
    handleRemoveFriend,
    isRemovingFriend,
  } = useFriends();

  const removeFriendDialog = createModalSignal();

  const handleRemoveClick = () => {
    removeFriendDialog.open();
  };

  const handleConfirmRemove = async () => {
    try {
      await handleRemoveFriend(props.friend.userId);
      removeFriendDialog.close();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  return (
    <div
      class="group relative flex items-center bg-white rounded-xl p-4 shadow-md border-2 border-primary-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200">
      <div class="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <Show
          when={props.friend.profileImage && props.friend.profileImage.trim() !== ''}
          fallback={
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <span class="text-white font-semibold text-sm">
                {(props.friend.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          }
        >
          <img
            src={props.friend.profileImage}
            alt={`${props.friend.username}'s profile`}
            class="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
            onError={(e) => {
              // Fallback to gradient avatar if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-sm flex-shrink-0 hidden">
            <span class="text-white font-semibold text-sm">
              {(props.friend.username || 'U')[0].toUpperCase()}
            </span>
          </div>
        </Show>

        {/* Friend info */}
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-800 text-sm block truncate">
            {props.friend.username || 'Unknown User'}
          </p>
          <Show when={props.friend.twitchLogin}>
            <p class="text-xs text-gray-600 opacity-80 block truncate">
              Twitch: {props.friend.twitchLogin}
            </p>
          </Show>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemoveClick}
          disabled={isRemovingFriend()}
          class="
          flex-shrink-0 p-2 rounded-full transition-all duration-200
          hover:bg-red-100 focus:bg-red-100
          group-hover:opacity-100 opacity-70
          focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white outline-none
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        "
          aria-label={`Remove ${props.friend.username} from friends`}
          title="Remove friend"
        >
          <FaSolidXmark class="w-4 h-4 text-red-500 hover:text-red-600"/>
        </button>
      </div>

      {/* Subtle hover effect */}
      <div
        class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-primary-500"></div>

      <ConfirmationDialog
        isOpen={removeFriendDialog.isOpen()}
        onOpenChange={removeFriendDialog.setOpen}
        title="Remove Friend"
        text={`Are you sure you want to remove ${props.friend.username} from your friends list? This action cannot be undone.`}
        onConfirm={handleConfirmRemove}
        onCancel={removeFriendDialog.close}
      />
    </div>
  );
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div
      class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
      <FaSolidUsers class="w-8 h-8 text-white"/>
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">No friends yet</h3>
    <p class="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
      You haven't added any friends yet. Search for users above and send friend requests to start building your network.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
    <div class="animate-pulse bg-gray-200 rounded-xl h-16 shadow-sm"></div>
  </div>
);
/**
 * UserFriendsList Component
 *
 * Displays the user's current friends with removal functionality.
 * Enhanced with sophisticated friend cards, better removal UX, and engaging empty states.
 */
export const UserFriendsList: Component = () => {
  const {
    friendsList,
    isLoadingFriends,
    hasFriendsError,
    friendsErrorMessage,
    hasRemoveFriendError,
    removeFriendErrorMessage
  } = useFriends();

  const hasFriends = () => friendsList().length > 0;

  return (
    <div class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaSolidUsers class="w-4 h-4 text-primary"/>
          Your Friends
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasRemoveFriendError()}>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div class="flex items-center gap-3 text-red-600">
            <FaSolidCircleExclamation class="w-4 h-4 flex-shrink-0"/>
            <p class="text-sm font-medium">{removeFriendErrorMessage() || "Failed to remove friend"}</p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingFriends()}>
          <LoadingSkeleton/>
        </Match>

        <Match when={hasFriendsError()}>
          <div class="bg-red-50 rounded-xl p-6 border border-red-200">
            <div class="flex items-center justify-center gap-3 text-red-600">
              <FaSolidCircleExclamation class="w-5 h-5 flex-shrink-0"/>
              <div>
                <p class="font-semibold text-sm">Error loading friends</p>
                <p class="text-xs opacity-90">{friendsErrorMessage() || "Unknown error occurred"}</p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasFriends()}>
          <EmptyState/>
        </Match>

        <Match when={hasFriends()}>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ~gap-3/4">
            <For each={friendsList()}>
              {(friend) => (
                <FriendListItem
                  friend={friend}
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

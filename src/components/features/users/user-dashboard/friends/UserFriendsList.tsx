import { type Component, For, Match, Show, Switch } from 'solid-js'
import { useFriends } from './UserFriendsProvider.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCircleExclamation,
  FaSolidUsers,
  FaSolidXmark,
} from 'solid-icons/fa'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'

interface Friend {
  userId: number
  username: string
  profileImage: string
  twitchLogin: string | null
}

interface FriendListItemProps {
  friend: Friend
}

const FriendListItem: Component<FriendListItemProps> = (props) => {
  const { handleRemoveFriend, isRemovingFriend } = useFriends()

  const removeFriendDialog = createModalSignal()

  const handleRemoveClick = () => {
    removeFriendDialog.open()
  }

  const handleConfirmRemove = async () => {
    try {
      await handleRemoveFriend(props.friend.userId)
      removeFriendDialog.close()
    } catch (error) {
      console.error('Failed to remove friend:', error)
    }
  }

  return (
    <>
      <div class="rounded-group bg-surface-strong text-fg ring-1 ring-line group flex items-center gap-3 p-4">
        <Show
          when={
            props.friend.profileImage && props.friend.profileImage.trim() !== ''
          }
          fallback={
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-500 shadow-xs">
              <span class="text-sm font-semibold text-white">
                {(props.friend.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          }
        >
          <img
            src={props.friend.profileImage}
            alt={`${props.friend.username}'s profile`}
            class="h-10 w-10 shrink-0 rounded-full object-cover shadow-xs"
            onError={(e) => {
              // Fallback to gradient avatar if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div class="flex hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-500 shadow-xs">
            <span class="text-sm font-semibold text-white">
              {(props.friend.username || 'U')[0].toUpperCase()}
            </span>
          </div>
        </Show>

        {/* Friend info */}
        <div class="min-w-0 flex-1">
          <a
            target={`_blank`}
            href={'/' + props.friend.username}
            class="flex items-center justify-start gap-2 truncate text-sm font-semibold text-fg underline hover:text-accent-500"
          >
            {props.friend.username || 'Unknown User'}{' '}
            <FaSolidArrowUpRightFromSquare />
          </a>
          <Show when={props.friend.twitchLogin}>
            <p class="block truncate text-xs text-fg-muted opacity-80">
              Twitch: {props.friend.twitchLogin}
            </p>
          </Show>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemoveClick}
          disabled={isRemovingFriend()}
          class="shrink-0 rounded-full p-2 opacity-70 outline-hidden transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-danger-100 focus:bg-danger-100 focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Remove ${props.friend.username} from friends`}
          title="Remove friend"
        >
          <FaSolidXmark class="h-4 w-4 text-danger-500 hover:text-danger-600" />
        </button>
      </div>

      <ConfirmationDialog
        isOpen={removeFriendDialog.isOpen()}
        onOpenChange={removeFriendDialog.setOpen}
        title="Remove Friend"
        text={`Are you sure you want to remove ${props.friend.username} from your friends list? This action cannot be undone.`}
        onConfirm={handleConfirmRemove}
        onCancel={removeFriendDialog.close}
      />
    </>
  )
}

const EmptyState = () => (
  <div class="flex flex-col items-center justify-center px-4 py-12">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-500 shadow-lg">
      <FaSolidUsers class="h-8 w-8 text-white" />
    </div>
    <h3 class="mb-2 text-xl font-semibold text-fg">No friends yet</h3>
    <p class="mb-6 max-w-md text-center leading-relaxed text-fg-muted">
      You haven't added any friends yet. Search for users above and send friend
      requests to start building your network.
    </p>
  </div>
)

const LoadingSkeleton = () => (
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
    <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
  </div>
)
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
    removeFriendErrorMessage,
  } = useFriends()

  const hasFriends = () => friendsList().length > 0

  return (
    <div class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-fg">
          <FaSolidUsers class="h-4 w-4 text-primary" />
          Your Friends
        </h3>
      </div>

      {/* Error messages */}
      <Show when={hasRemoveFriendError()}>
        <div class="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div class="flex items-center gap-3 text-danger-600">
            <FaSolidCircleExclamation class="h-4 w-4 shrink-0" />
            <p class="text-sm font-medium">
              {removeFriendErrorMessage() || 'Failed to remove friend'}
            </p>
          </div>
        </div>
      </Show>

      <Switch>
        <Match when={isLoadingFriends()}>
          <LoadingSkeleton />
        </Match>

        <Match when={hasFriendsError()}>
          <div class="rounded-xl border border-danger-200 bg-danger-50 p-6">
            <div class="flex items-center justify-center gap-3 text-danger-600">
              <FaSolidCircleExclamation class="h-5 w-5 shrink-0" />
              <div>
                <p class="text-sm font-semibold">Error loading friends</p>
                <p class="text-xs opacity-90">
                  {friendsErrorMessage() || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!hasFriends()}>
          <EmptyState />
        </Match>

        <Match when={hasFriends()}>
          <div class="grid grid-cols-1 fl-gap-3/4 sm:grid-cols-1 lg:grid-cols-2">
            <For each={friendsList()}>
              {(friend) => <FriendListItem friend={friend} />}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  )
}

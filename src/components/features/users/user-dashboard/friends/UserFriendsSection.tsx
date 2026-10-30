import { type Component } from 'solid-js'
import {
  FaSolidPaperPlane,
  FaSolidUserPlus,
  FaSolidUsers,
  FaSolidXmark,
} from 'solid-icons/fa'
import { useFriends } from './UserFriendsProvider.tsx'
import {
  createConfirm,
  type ListUser,
  searchName,
  UserListSection,
  UserRow,
  UserSearchResults,
} from '../common/UserList.tsx'
import { Section } from '../../../../ui/Tile'
import { SearchField } from '../../../../ui/Form'
import { Button, IconButton } from '../../../../ui/Button'
import { ConfirmDialog } from '../../../../ui/Dialog'

/**
 * Search users to befriend, the friends list, and incoming / sent requests. The three lists are live
 * feeds (friendsWS), so changes from the other side arrive without a reload.
 */
export const UserFriendsSection: Component = () => (
  <div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
    <div class="flex flex-col gap-3">
      <FindFriends />
      <FriendsList />
    </div>
    <div class="flex flex-col gap-3">
      <FriendRequests />
      <SentFriendRequests />
    </div>
  </div>
)

const FindFriends: Component = () => {
  const f = useFriends()

  const isFriend = (userId: number) =>
    f.friendsList().some((friend) => friend.userId === userId)
  const isPending = (userId: number) =>
    f.friendRequests().some((request) => request.userId === userId) ||
    f.sentFriendRequests().some((request) => request.userId === userId)

  return (
    <Section level={3} title="Find Friends" icon={<FaSolidUserPlus />}>
      <div class="flex flex-col gap-3">
        <SearchField
          label="Search for users to add as friends"
          placeholder="Search by username"
          value={f.searchInput()}
          onInput={f.handleSearchInput}
          loading={f.isLoadingSearch() && f.searchInput().length > 0}
        />
        <UserSearchResults
          results={f.searchResults()}
          query={f.debouncedInput()}
          loading={f.isLoadingSearch()}
          searchError={f.hasSearchError() && f.searchErrorMessage()}
          actionError={
            f.hasSendFriendRequestError() && f.sendFriendRequestErrorMessage()
          }
          purpose={<>to add as friends</>}
          action={(user) => {
            const canSend = () => !isFriend(user.userId) && !isPending(user.userId)
            return (
              <Button
                size="sm"
                variant={canSend() ? 'accent' : 'secondary'}
                disabled={!canSend() || f.isSendingFriendRequest()}
                aria-label={`${canSend() ? 'Send friend request to' : 'Cannot send friend request to'} ${searchName(user)}`}
                onClick={() =>
                  f.handleSendFriendRequest(user.userId).catch(() => {})
                }
              >
                {f.isSendingFriendRequest()
                  ? 'Sending...'
                  : isFriend(user.userId)
                    ? 'Already Friends'
                    : isPending(user.userId)
                      ? 'Request Pending'
                      : 'Add Friend'}
              </Button>
            )
          }}
        />
      </div>
    </Section>
  )
}

const FriendsList: Component = () => {
  const f = useFriends()
  const confirm = createConfirm<ListUser>()

  return (
    <>
      <UserListSection
        title="Your Friends"
        icon={<FaSolidUsers />}
        items={f.friendsList()}
        loading={f.isLoadingFriends()}
        error={f.hasFriendsError() && f.friendsErrorMessage()}
        errorTitle="Error loading friends"
        actionErrors={[f.hasRemoveFriendError() && f.removeFriendErrorMessage()]}
        empty={{
          title: 'No friends yet',
          text: "You haven't added any friends yet. Search for users and send them a friend request.",
        }}
      >
        {(friend) => (
          <UserRow
            user={friend}
            actions={
              <IconButton
                variant="ghost"
                size="sm"
                class="text-danger-600"
                disabled={f.isRemovingFriend()}
                aria-label={`Remove ${friend.username} from friends`}
                title="Remove friend"
                onClick={() => confirm.ask(friend)}
              >
                <FaSolidXmark class="size-4" aria-hidden="true" />
              </IconButton>
            }
          />
        )}
      </UserListSection>
      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Remove Friend"
        text={`Are you sure you want to remove ${confirm.target()?.username} from your friends list? This action cannot be undone.`}
        pending={f.isRemovingFriend()}
        onConfirm={() => confirm.run((row) => f.handleRemoveFriend(row.userId))}
      />
    </>
  )
}

const FriendRequests: Component = () => {
  const f = useFriends()
  const confirm = createConfirm<ListUser>()
  const busy = () => f.isAcceptingFriendRequest() || f.isDecliningFriendRequest()

  return (
    <>
      <UserListSection
        title="Friend Requests"
        icon={<FaSolidUserPlus />}
        items={f.friendRequests()}
        loading={f.isLoadingFriendRequests()}
        error={f.hasFriendRequestsError() && f.friendRequestsErrorMessage()}
        errorTitle="Error loading friend requests"
        actionErrors={[
          f.hasAcceptFriendRequestError() && f.acceptFriendRequestErrorMessage(),
          f.hasDeclineFriendRequestError() &&
            f.declineFriendRequestErrorMessage(),
        ]}
        empty={{
          title: 'No pending friend requests',
          text: 'When someone sends you a friend request, it shows up here.',
        }}
      >
        {(request) => (
          <UserRow
            user={request}
            actions={
              <div class="flex gap-1.5">
                <Button
                  size="sm"
                  variant="accent"
                  disabled={busy()}
                  aria-label={`Accept friend request from ${request.username}`}
                  onClick={() =>
                    f.handleAcceptFriendRequest(request.userId).catch(() => {})
                  }
                >
                  {f.isAcceptingFriendRequest() ? 'Accepting...' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  disabled={busy()}
                  aria-label={`Decline friend request from ${request.username}`}
                  onClick={() => confirm.ask(request)}
                >
                  {f.isDecliningFriendRequest() ? 'Declining...' : 'Decline'}
                </Button>
              </div>
            }
          />
        )}
      </UserListSection>
      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Decline Friend Request"
        text={`Are you sure you want to decline the friend request from ${confirm.target()?.username}? This action cannot be undone.`}
        pending={f.isDecliningFriendRequest()}
        onConfirm={() => confirm.run((row) => f.handleDeclineFriendRequest(row.userId))}
      />
    </>
  )
}

const SentFriendRequests: Component = () => {
  const f = useFriends()
  const confirm = createConfirm<ListUser>()

  return (
    <>
      <UserListSection
        title="Sent Friend Requests"
        icon={<FaSolidPaperPlane />}
        items={f.sentFriendRequests()}
        loading={f.isLoadingSentFriendRequests()}
        error={
          f.hasSentFriendRequestsError() && f.sentFriendRequestsErrorMessage()
        }
        errorTitle="Error loading sent friend requests"
        actionErrors={[
          f.hasCancelFriendRequestError() && f.cancelFriendRequestErrorMessage(),
        ]}
        empty={{
          title: 'No sent friend requests',
          text: 'Requests you send stay here until the other person answers.',
        }}
      >
        {(request) => (
          <UserRow
            user={request}
            actions={
              <Button
                size="sm"
                disabled={f.isCancellingFriendRequest()}
                aria-label={`Cancel friend request to ${request.username}`}
                onClick={() => confirm.ask(request)}
              >
                {f.isCancellingFriendRequest() ? 'Cancelling...' : 'Cancel'}
              </Button>
            }
          />
        )}
      </UserListSection>
      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Cancel Friend Request"
        text={`Are you sure you want to cancel your friend request to ${confirm.target()?.username}? This action cannot be undone.`}
        pending={f.isCancellingFriendRequest()}
        onConfirm={() => confirm.run((row) => f.handleCancelFriendRequest(row.userId))}
      />
    </>
  )
}

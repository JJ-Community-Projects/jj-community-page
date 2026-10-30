import { type Component } from 'solid-js'
import { FaSolidBan, FaSolidUserSlash } from 'solid-icons/fa'
import { useBlocks } from './UserBlockProvider.tsx'
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
import { Button } from '../../../../ui/Button'
import { ConfirmDialog } from '../../../../ui/Dialog'
import { Alert } from '../../../../ui/Status'

/**
 * Search users to block and the blocked list. Uses plain TanStack Query with refetch (no live feed).
 */
export const UserBlocksSection: Component = () => (
  <div class="flex flex-col gap-3">
    <Alert tone="info" title="What blocking does">
      <ul class="list-disc space-y-0.5 pl-4">
        <li>Blocked users cannot send you friend requests.</li>
        <li>
          Blocked users will not appear in your <strong>Related</strong>{' '}
          section.
        </li>
        <li>
          You will not appear in the <strong>Related</strong> section of users
          you have blocked.
        </li>
      </ul>
    </Alert>
    <FindUsersToBlock />
    <BlockedUsers />
  </div>
)

const FindUsersToBlock: Component = () => {
  const b = useBlocks()
  const isBlocked = (userId: number) =>
    b.blockedUsers().some((user) => user.userId === userId)

  return (
    <Section level={3} title="Find Users to Block" icon={<FaSolidUserSlash />}>
      <div class="flex flex-col gap-3">
        <SearchField
          label="Search for users to block"
          placeholder="Search by username"
          value={b.searchInput()}
          onInput={b.handleSearchInput}
          loading={b.isLoadingSearch() && b.searchInput().length > 0}
        />
        <UserSearchResults
          results={b.searchResults()}
          query={b.debouncedInput()}
          loading={b.isLoadingSearch()}
          searchError={b.hasSearchError() && b.searchErrorMessage()}
          actionError={b.hasBlockError() && b.blockErrorMessage()}
          purpose={<>to block</>}
          action={(user) => {
            const canBlock = () => !isBlocked(user.userId)
            return (
              <Button
                size="sm"
                variant={canBlock() ? 'danger' : 'secondary'}
                disabled={!canBlock() || b.isBlockingUser()}
                aria-label={`${canBlock() ? 'Block' : 'Cannot block'} ${searchName(user)}`}
                onClick={() => b.handleBlockUser(user.userId).catch(() => {})}
              >
                <FaSolidBan class="size-3" aria-hidden="true" />
                {b.isBlockingUser()
                  ? 'Blocking...'
                  : canBlock()
                    ? 'Block User'
                    : 'Already Blocked'}
              </Button>
            )
          }}
        />
      </div>
    </Section>
  )
}

const BlockedUsers: Component = () => {
  const b = useBlocks()
  const confirm = createConfirm<ListUser>()

  return (
    <>
      <UserListSection
        title="Blocked Users"
        icon={<FaSolidUserSlash />}
        items={b.blockedUsers()}
        loading={b.isLoadingBlockedUsers()}
        error={b.hasBlockedUsersError() && b.blockedUsersErrorMessage()}
        errorTitle="Error loading blocked users"
        actionErrors={[b.hasUnblockError() && b.unblockErrorMessage()]}
        empty={{
          title: 'No blocked users',
          text: "You haven't blocked anyone. Use the search above to find users to block.",
        }}
        columns={2}
      >
        {(user) => (
          <UserRow
            user={user}
            actions={
              <Button
                size="sm"
                disabled={b.isUnblockingUser()}
                aria-label={`Unblock ${user.username}`}
                title="Unblock user"
                onClick={() => confirm.ask(user)}
              >
                {b.isUnblockingUser() ? 'Unblocking...' : 'Unblock'}
              </Button>
            }
          />
        )}
      </UserListSection>
      <ConfirmDialog
        open={confirm.isOpen()}
        onOpenChange={confirm.onOpenChange}
        title="Unblock User"
        text={`Are you sure you want to unblock ${confirm.target()?.username}? They will be able to interact with you again.`}
        tone="primary"
        pending={b.isUnblockingUser()}
        onConfirm={() => confirm.run((row) => b.handleUnblockUser(row.userId))}
      />
    </>
  )
}

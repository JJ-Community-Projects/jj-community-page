import { type Component, Show } from 'solid-js'
import { FaSolidUserPlus } from 'solid-icons/fa'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { AdminHeading } from './AdminTeamMembersSection.tsx'
import { useUserSearch } from '../../../../../../lib/useUserSearch'
import { SearchField } from '../../../../../ui/Form'
import { Button } from '../../../../../ui/Button'
import { searchName, UserSearchResults } from '../../common/UserList.tsx'

/** User search to invite someone to the team; results only show while there is a query. */
export const AdminTeamInviteSearchInput: Component = () => {
  const { inviteUser, inviteUserMutation } = useAdminTeamDetail()
  const userSearch = useUserSearch()

  const handleInvite = async (userId: number) => {
    try {
      await inviteUser(userId)
      userSearch.clear()
    } catch (err) {
      // Shown by the mutation state
      console.error('Invite error:', err)
    }
  }

  return (
    <div>
      <AdminHeading title="Invite Users" icon={FaSolidUserPlus} />
      <div class="flex flex-col gap-3">
        <SearchField
          label="Search for users to invite"
          placeholder="Search by username"
          value={userSearch.searchInput()}
          onInput={userSearch.handleSearchInput}
          loading={
            userSearch.isLoading() && userSearch.searchInput().length > 0
          }
        />
        <Show when={userSearch.searchInput().length > 0}>
          <UserSearchResults
            results={userSearch.results()}
            query={userSearch.debouncedInput()}
            loading={userSearch.isLoading()}
            searchError={userSearch.hasError() && userSearch.errorMessage()}
            actionError={
              inviteUserMutation.isError &&
              (inviteUserMutation.failureReason?.message ||
                'Failed to invite user')
            }
            purpose={<>to invite</>}
            level={4}
            action={(user) => (
              <Button
                size="sm"
                variant="accent"
                disabled={inviteUserMutation.isPending}
                aria-label={`Invite ${searchName(user)} to team`}
                onClick={() => handleInvite(user.userId)}
              >
                <FaSolidUserPlus class="size-3" aria-hidden="true" />
                {inviteUserMutation.isPending ? 'Inviting...' : 'Invite'}
              </Button>
            )}
          />
        </Show>
      </div>
    </div>
  )
}

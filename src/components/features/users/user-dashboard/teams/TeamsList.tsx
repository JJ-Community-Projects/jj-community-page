import { type Component, createSignal, For, Show } from 'solid-js'
import { UserProvider, useUser } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { CreateTeamDialog } from './teamAdmin/CreateTeamDialog.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidChevronLeft,
  FaSolidCrown,
  FaSolidEnvelope,
  FaSolidPlus,
  FaSolidUsers,
} from 'solid-icons/fa'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { QueryComponent } from '../../../../common/QueryComponent.tsx'
import {
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'

interface TeamsListProps {
  user: User
}

export const TeamsList: Component<TeamsListProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <TeamsListContent />
      </UserProvider>
    </QueryClientProvider>
  )
}

const TeamsListContent: Component = () => {
  return (
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <TeamsHeader />
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OwnedTeamsList />
        <MemberTeamsList />
        <InvitesList />
      </div>
    </div>
  )
}

const TeamsHeader: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false)

  const canCreateTeam = useQuery(() =>
    orpcPrivate.teams.canCreateTeam.queryOptions(),
  )

  const disabled = () => {
    if (canCreateTeam.isPending) {
      return true
    }
    if (canCreateTeam.data) {
      return !canCreateTeam.data!.canCreate
    }
  }

  return (
    <div class="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl">
      <div class="~p-4/8">
        <div class="flex flex-col gap-4">
          <div>
            <a
              href={`/dashboard`}
              class="flex flex-row items-center gap-1 text-primary transition-colors duration-200 hover:underline"
            >
              <FaSolidChevronLeft class="h-4 w-4" />
              <span class="text-sm font-medium">Back to Dashboard</span>
            </a>
          </div>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Your Teams</h1>
            <button
              class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-white shadow-sm outline-none transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white active:scale-95"
              onClick={() => setIsOpen(true)}
              disabled={disabled()}
            >
              <FaSolidPlus class="h-4 w-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  )
}

const OwnedTeamsList: Component = () => {
  const { user } = useUser()

  const canCreateTeam = useQuery(() =>
    orpcPrivate.teams.canCreateTeam.queryOptions(),
  )

  return (
    <div class="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl">
      <div class="~p-4/8">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FaSolidCrown class="h-5 w-5 text-primary" />
          <Show when={canCreateTeam.data} fallback={<>Teams You Own</>}>
            {(data) => (
              <>
                Teams You Own ({data().teams}/{data().maxOwnedTeams})
              </>
            )}
          </Show>
        </h3>

        <QueryComponent
          queryOptions={() =>
            orpcPrivate.teamsWS.getUserTeamsWS.experimental_liveOptions()
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
              <div class="mb-3 flex items-center justify-center gap-3 text-danger-600">
                <div>
                  <p class="text-sm font-semibold">Failed to load teams</p>
                  <p class="text-xs opacity-90">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="rounded-lg bg-danger px-4 py-2 text-white outline-none transition-all duration-200 hover:bg-danger-600 focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white"
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => {
            const teams = result.teams.filter((t) => t.ownerId === user.id)
            return (
              <Show
                when={teams.length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center px-4 py-12">
                    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                      <FaSolidCrown class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="mb-2 text-xl font-semibold text-gray-800">
                      No teams owned
                    </h4>
                    <p class="max-w-md text-center leading-relaxed text-gray-600">
                      You don't own any teams yet. Create your first team to get
                      started.
                    </p>
                  </div>
                }
              >
                <div class="space-y-4">
                  <For each={teams}>
                    {(team) => (
                      <a
                        href={`/dashboard/teams/${team.id}`}
                        class="group block rounded-xl border-2 bg-white p-4 shadow-md outline-none transition-all duration-300 hover:border-primary-200"
                      >
                        <div class="flex items-center justify-between">
                          <div class="min-w-0 flex-1">
                            <h4 class="mb-1 truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary">
                              {team.name}
                            </h4>
                          </div>
                          <div class="ml-3 flex items-center gap-2">
                            <FaSolidArrowUpRightFromSquare class="h-4 w-4 text-gray-400 transition-colors group-hover:text-primary" />
                          </div>
                        </div>
                      </a>
                    )}
                  </For>
                </div>
              </Show>
            )
          }}
        </QueryComponent>
      </div>
    </div>
  )
}

const MemberTeamsList: Component = () => {
  const { user } = useUser()

  const canInviteCurrentUser = useQuery(() =>
    orpcPrivate.teams.canInviteCurrentUser.queryOptions(),
  )

  return (
    <div class="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl">
      <div class="~p-4/8">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FaSolidUsers class="h-5 w-5 text-accent" />
          <Show
            when={canInviteCurrentUser.data}
            fallback={<>Teams You're In</>}
          >
            {(data) => (
              <>
                Teams You're In ({data().teams}/{data().maxTeams})
              </>
            )}
          </Show>
        </h3>

        <QueryComponent
          queryOptions={() =>
            orpcPrivate.teamsWS.getUserTeamsWS.experimental_liveOptions()
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
              <div class="mb-3 flex items-center justify-center gap-3 text-danger-600">
                <div>
                  <p class="text-sm font-semibold">Failed to load teams</p>
                  <p class="text-xs opacity-90">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="rounded-lg bg-danger px-4 py-2 text-white outline-none transition-all duration-200 hover:bg-danger-600 focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white"
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => {
            const teams = result.teams.filter((t) => t.ownerId !== user.id)
            return (
              <Show
                when={teams.length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center px-4 py-12">
                    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg">
                      <FaSolidUsers class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="mb-2 text-xl font-semibold text-gray-800">
                      No team memberships
                    </h4>
                    <p class="max-w-md text-center leading-relaxed text-gray-600">
                      You're not a member of any teams yet. Accept team
                      invitations to join teams.
                    </p>
                  </div>
                }
              >
                <div class="space-y-4">
                  <For each={teams}>
                    {(team) => (
                      <a
                        href={`/dashboard/teams/${team.id}`}
                        class="group block rounded-xl border-2 bg-white p-4 shadow-md outline-none transition-all duration-300 hover:border-accent-100"
                      >
                        <div class="flex items-center justify-between">
                          <h4 class="mb-1 flex-1 truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-accent">
                            {team.name}
                          </h4>
                          <div class="ml-3 flex items-center gap-2">
                            <FaSolidArrowUpRightFromSquare class="h-4 w-4 text-gray-400 transition-colors group-hover:text-accent" />
                          </div>
                        </div>
                      </a>
                    )}
                  </For>
                </div>
              </Show>
            )
          }}
        </QueryComponent>
      </div>
    </div>
  )
}

const InvitesList: Component = () => {
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null)
  const [isAcceptAction, setIsAcceptAction] = createSignal(false)
  const confirmDialog = createModalSignal()
  const client = useQueryClient()
  // Create mutations for accept and reject operations
  const acceptInviteMutation = useMutation(() =>
    orpcPrivate.teams.acceptInvite.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.getUserInvites.key(),
        })

        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.canCreateTeam.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.canInviteCurrentUser.queryKey(),
        })
      },
    }),
  )
  const rejectInviteMutation = useMutation(() =>
    orpcPrivate.teams.rejectInvite.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.getUserInvites.key(),
        })

        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.canCreateTeam.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: orpcPrivate.teams.canInviteCurrentUser.queryKey(),
        })
      },
    }),
  )

  const openConfirmDialog = (teamId: number, isAccept: boolean) => {
    setSelectedTeamId(teamId)
    setIsAcceptAction(isAccept)
    confirmDialog.open()
  }

  const handleConfirm = async () => {
    const teamId = selectedTeamId()
    if (teamId === null) return

    try {
      if (isAcceptAction()) {
        await acceptInviteMutation.mutateAsync({ teamId })
      } else {
        await rejectInviteMutation.mutateAsync({ teamId })
      }
      confirmDialog.close()
    } catch (error) {
      console.error(
        `Failed to ${isAcceptAction() ? 'accept' : 'reject'} invitation:`,
        error,
      )
      // Error will be displayed in the confirmation dialog
    }
  }

  return (
    <div class="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl">
      <div class="~p-4/8">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FaSolidEnvelope class="h-5 w-5 text-warning" />
          Team Invitations
        </h3>

        <QueryComponent
          // queryOptions={() => orpcPrivate.teams.getUserInvites.queryOptions()}
          queryOptions={() =>
            orpcPrivate.teamsWS.getUserTeamInvitesWS.experimental_liveOptions()
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
              <div class="h-20 animate-pulse rounded-xl bg-gray-200 shadow-sm"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
              <div class="mb-3 flex items-center justify-center gap-3 text-danger-600">
                <div>
                  <p class="text-sm font-semibold">
                    Failed to load invitations
                  </p>
                  <p class="text-xs opacity-90">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="rounded-lg bg-danger px-4 py-2 text-white outline-none transition-all duration-200 hover:bg-danger-600 focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white"
              >
                Retry
              </button>
            </div>
          )}
        >
          {(result) => (
            <Show
              when={result.invites.length > 0}
              fallback={
                <div class="flex flex-col items-center justify-center px-4 py-12">
                  <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warning-500 to-warning-600 shadow-lg">
                    <FaSolidEnvelope class="h-8 w-8 text-white" />
                  </div>
                  <h4 class="mb-2 text-xl font-semibold text-gray-800">
                    No pending invitations
                  </h4>
                  <p class="max-w-md text-center leading-relaxed text-gray-600">
                    You don't have any team invitations at the moment. Team
                    owners can invite you to join their teams.
                  </p>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={result.invites}>
                  {(invite) => (
                    <div class="flex flex-col gap-4 rounded-xl border-2 bg-white p-2 shadow-md transition-all duration-300 hover:border-warning-100">
                      <p class="text-xs text-gray-600">
                        <span>You've been invited to join: </span>
                        <span class="truncate text-sm font-semibold text-gray-900">
                          {invite.name}
                        </span>
                      </p>

                      <div class="flex items-center gap-2">
                        <button
                          onClick={() => openConfirmDialog(invite.teamId, true)}
                          disabled={
                            acceptInviteMutation.isPending ||
                            rejectInviteMutation.isPending
                          }
                          class="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white outline-none transition-all duration-200 hover:bg-success-600 hover:shadow-sm focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() =>
                            openConfirmDialog(invite.teamId, false)
                          }
                          disabled={
                            acceptInviteMutation.isPending ||
                            rejectInviteMutation.isPending
                          }
                          class="flex items-center gap-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white outline-none transition-all duration-200 hover:bg-danger-600 hover:shadow-sm focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          )}
        </QueryComponent>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen()}
        onOpenChange={confirmDialog.setOpen}
        title={
          isAcceptAction() ? 'Accept Team Invitation' : 'Reject Team Invitation'
        }
        text={
          isAcceptAction()
            ? acceptInviteMutation.error
              ? `Error: ${acceptInviteMutation.error.message}`
              : 'Are you sure you want to accept this invitation?'
            : rejectInviteMutation.error
              ? `Error: ${rejectInviteMutation.error.message}`
              : 'Are you sure you want to reject this invitation?'
        }
        onConfirm={handleConfirm}
        onCancel={confirmDialog.close}
      />

      {/* Display loading indicators for the buttons in the invite list */}
      <Show
        when={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
      >
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div class="rounded-lg bg-white p-4 shadow-xl">
            <div class="flex items-center gap-2">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
              <span>
                {isAcceptAction()
                  ? 'Accepting invitation...'
                  : 'Rejecting invitation...'}
              </span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

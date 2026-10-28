import { type Component, createSignal, For, Show } from 'solid-js'
import { UserProvider, useUser } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { ConfirmationDialog } from '../../../../common/dialogs/ConfirmationDialog.tsx'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { CreateTeamDialog } from './teamAdmin/CreateTeamDialog.tsx'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCrown,
  FaSolidEnvelope,
  FaSolidPlus,
  FaSolidUsers,
} from 'solid-icons/fa'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { feedRenewal } from '../../../../../lib/orpc/tokenRenewal.ts'
import { QueryComponent } from '../../../../common/QueryComponent.tsx'
import {
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { PageHeader } from '../../../../ui/PageHeader'
import { Button } from '../../../../ui/Button'

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
    <div class="flex flex-col gap-3">
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
    <div>
      <PageHeader
        title="Your Teams"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
        actions={
          <Button
            variant="accent"
            onClick={() => setIsOpen(true)}
            disabled={disabled()}
          >
            <FaSolidPlus class="size-3.5" aria-hidden="true" />
            Create Team
          </Button>
        }
      />

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  )
}

const OwnedTeamsList: Component = () => {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const userTeams = orpcPrivate.teamsWS.getUserTeamsWS

  const canCreateTeam = useQuery(() =>
    orpcPrivate.teams.canCreateTeam.queryOptions(),
  )

  return (
    <div class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line overflow-hidden bg-linear-to-b ring-1">
      <div class="fl-p-4/8">
        <h3 class="text-fg mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidCrown class="text-primary h-5 w-5" />
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
            userTeams.experimental_liveOptions({
              context: feedRenewal(queryClient, userTeams),
            })
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="border-danger-200 bg-danger-50 rounded-xl border p-6 text-center">
              <div class="text-danger-600 mb-3 flex items-center justify-center gap-3">
                <div>
                  <p class="text-sm font-semibold">Failed to load teams</p>
                  <p class="text-xs opacity-90">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="bg-danger hover:bg-danger-600 focus:ring-danger rounded-lg px-4 py-2 text-white outline-hidden transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
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
                    <div class="from-primary-500 to-primary-600 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br shadow-lg">
                      <FaSolidCrown class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-fg mb-2 text-xl font-semibold">
                      No teams owned
                    </h4>
                    <p class="text-fg-muted max-w-md text-center leading-relaxed">
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
                        class="rounded-group bg-surface-strong text-fg ring-line group hover:bg-surface block p-4 ring-1 transition-colors"
                      >
                        <div class="flex items-center justify-between">
                          <div class="min-w-0 flex-1">
                            <h4 class="text-fg group-hover:text-primary mb-1 truncate text-sm font-semibold transition-colors">
                              {team.name}
                            </h4>
                          </div>
                          <div class="ml-3 flex items-center gap-2">
                            <FaSolidArrowUpRightFromSquare class="text-fg-muted group-hover:text-primary h-4 w-4 transition-colors" />
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
  const queryClient = useQueryClient()
  const userTeams = orpcPrivate.teamsWS.getUserTeamsWS

  const canInviteCurrentUser = useQuery(() =>
    orpcPrivate.teams.canInviteCurrentUser.queryOptions(),
  )

  return (
    <div class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line overflow-hidden bg-linear-to-b ring-1">
      <div class="fl-p-4/8">
        <h3 class="text-fg mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidUsers class="text-accent h-5 w-5" />
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
            userTeams.experimental_liveOptions({
              context: feedRenewal(queryClient, userTeams),
            })
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="border-danger-200 bg-danger-50 rounded-xl border p-6 text-center">
              <div class="text-danger-600 mb-3 flex items-center justify-center gap-3">
                <div>
                  <p class="text-sm font-semibold">Failed to load teams</p>
                  <p class="text-xs opacity-90">
                    {error.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
              <button
                onClick={refetch}
                class="bg-danger hover:bg-danger-600 focus:ring-danger rounded-lg px-4 py-2 text-white outline-hidden transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
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
                    <div class="from-accent-500 to-accent-600 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br shadow-lg">
                      <FaSolidUsers class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-fg mb-2 text-xl font-semibold">
                      No team memberships
                    </h4>
                    <p class="text-fg-muted max-w-md text-center leading-relaxed">
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
                        class="rounded-group bg-surface-strong text-fg ring-line group hover:bg-surface block p-4 ring-1 transition-colors"
                      >
                        <div class="flex items-center justify-between">
                          <h4 class="text-fg group-hover:text-accent mb-1 flex-1 truncate text-sm font-semibold transition-colors">
                            {team.name}
                          </h4>
                          <div class="ml-3 flex items-center gap-2">
                            <FaSolidArrowUpRightFromSquare class="text-fg-muted group-hover:text-accent h-4 w-4 transition-colors" />
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
    <div class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line overflow-hidden bg-linear-to-b ring-1">
      <div class="fl-p-4/8">
        <h3 class="text-fg mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidEnvelope class="text-warning h-5 w-5" />
          Team Invitations
        </h3>

        <QueryComponent
          queryOptions={() =>
            orpcPrivate.teamsWS.getUserTeamInvitesWS.experimental_liveOptions({
              context: feedRenewal(
                client,
                orpcPrivate.teamsWS.getUserTeamInvitesWS,
              ),
            })
          }
          loading={() => (
            <div class="space-y-3">
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
              <div class="h-20 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
            </div>
          )}
          error={(error, refetch) => (
            <div class="border-danger-200 bg-danger-50 rounded-xl border p-6 text-center">
              <div class="text-danger-600 mb-3 flex items-center justify-center gap-3">
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
                class="bg-danger hover:bg-danger-600 focus:ring-danger rounded-lg px-4 py-2 text-white outline-hidden transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white"
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
                  <div class="from-warning-500 to-warning-600 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br shadow-lg">
                    <FaSolidEnvelope class="h-8 w-8 text-white" />
                  </div>
                  <h4 class="text-fg mb-2 text-xl font-semibold">
                    No pending invitations
                  </h4>
                  <p class="text-fg-muted max-w-md text-center leading-relaxed">
                    You don't have any team invitations at the moment. Team
                    owners can invite you to join their teams.
                  </p>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={result.invites}>
                  {(invite) => (
                    <div class="rounded-group bg-surface-strong text-fg ring-line hover:bg-surface flex flex-col gap-4 p-2 ring-1 transition-colors">
                      <p class="text-fg-muted text-xs">
                        <span>You've been invited to join: </span>
                        <span class="text-fg truncate text-sm font-semibold">
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
                          class="bg-success hover:bg-success-600 focus:ring-success flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white outline-hidden transition-all duration-200 hover:shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                          class="bg-danger hover:bg-danger-600 focus:ring-danger flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white outline-hidden transition-all duration-200 hover:shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-offset-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line bg-linear-to-b p-4 ring-1">
            <div class="flex items-center gap-2">
              <div class="border-accent h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></div>
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

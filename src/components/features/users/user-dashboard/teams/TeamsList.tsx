import { type Component, createSignal, For, type JSX, Show } from 'solid-js'
import { UserProvider, useUser } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { CreateTeamDialog } from './teamAdmin/CreateTeamDialog.tsx'
import {
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
import { ConfirmDialog } from '../../../../ui/Dialog'
import { Tile } from '../../../../ui/Tile'
import { ListRow } from '../../../../ui/ListRow'
import { Alert, EmptyState, Skeleton } from '../../../../ui/Status'

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
      <div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
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

/** A column tile. The browser tests find a column by its h3 and scope to the heading's parent. */
const Column: Component<{
  title: JSX.Element
  icon: JSX.Element
  children: JSX.Element
}> = (props) => (
  <Tile>
    <h3 class="mb-3 flex min-h-8 items-center gap-2 text-base font-semibold">
      <span class="text-fg-muted flex size-5 items-center justify-center">
        {props.icon}
      </span>
      {props.title}
    </h3>
    {props.children}
  </Tile>
)

const ColumnLoading = () => (
  <div class="grid gap-2">
    <Skeleton class="h-12" />
    <Skeleton class="h-12" />
  </div>
)

const ColumnError = (title: string) => (error: Error, refetch: () => void) => (
  <Alert
    tone="danger"
    title={title}
    action={
      <Button size="sm" onClick={refetch}>
        Retry
      </Button>
    }
  >
    {error.message || 'Unknown error occurred'}
  </Alert>
)

/** Owned or joined teams from the live teams feed, as rows linking to the team page. */
const TeamRows: Component<{
  filter: (team: { ownerId: number }) => boolean
  empty: { title: string; text: string }
}> = (props) => {
  const queryClient = useQueryClient()
  const userTeams = orpcPrivate.teamsWS.getUserTeamsWS
  return (
    <QueryComponent
      queryOptions={() =>
        userTeams.experimental_liveOptions({
          context: feedRenewal(queryClient, userTeams),
        })
      }
      loading={ColumnLoading}
      error={ColumnError('Failed to load teams')}
    >
      {(result) => {
        const teams = result.teams.filter(props.filter)
        return (
          <Show
            when={teams.length > 0}
            fallback={
              <EmptyState title={props.empty.title}>
                {props.empty.text}
              </EmptyState>
            }
          >
            <div class="grid gap-2">
              <For each={teams}>
                {(team) => (
                  <ListRow
                    surface="group"
                    href={`/dashboard/teams/${team.id}`}
                    title={team.name}
                  />
                )}
              </For>
            </div>
          </Show>
        )
      }}
    </QueryComponent>
  )
}

const OwnedTeamsList: Component = () => {
  const { user } = useUser()
  const canCreateTeam = useQuery(() =>
    orpcPrivate.teams.canCreateTeam.queryOptions(),
  )

  return (
    <Column
      icon={<FaSolidCrown />}
      title={
        <Show when={canCreateTeam.data} fallback={<>Teams You Own</>}>
          {(data) => (
            <>
              Teams You Own ({data().teams}/{data().maxOwnedTeams})
            </>
          )}
        </Show>
      }
    >
      <TeamRows
        filter={(t) => t.ownerId === user.id}
        empty={{
          title: 'No teams owned',
          text: "You don't own any teams yet. Create your first team to get started.",
        }}
      />
    </Column>
  )
}

const MemberTeamsList: Component = () => {
  const { user } = useUser()
  const canInviteCurrentUser = useQuery(() =>
    orpcPrivate.teams.canInviteCurrentUser.queryOptions(),
  )

  return (
    <Column
      icon={<FaSolidUsers />}
      title={<>Teams You're In</>}
    >
      {/* The limit counts every team, owned ones included; this list leaves those out */}
      <Show when={canInviteCurrentUser.data}>
        {(data) => (
          <p class="text-fg-muted -mt-2 mb-3 text-xs">
            {data().teams} of {data().maxTeams} team slots used, owned teams
            included
          </p>
        )}
      </Show>
      <TeamRows
        filter={(t) => t.ownerId !== user.id}
        empty={{
          title: 'No team memberships',
          text: "You're not a member of any teams yet. Accept an invitation to join one.",
        }}
      />
    </Column>
  )
}

const InvitesList: Component = () => {
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null)
  const [isAcceptAction, setIsAcceptAction] = createSignal(false)
  const client = useQueryClient()
  const refreshLimits = async () => {
    await client.invalidateQueries({
      queryKey: orpcPrivate.teams.canCreateTeam.queryKey(),
    })
    await client.invalidateQueries({
      queryKey: orpcPrivate.teams.canInviteCurrentUser.queryKey(),
    })
  }
  const acceptInviteMutation = useMutation(() =>
    orpcPrivate.teams.acceptInvite.mutationOptions({
      onSuccess: refreshLimits,
    }),
  )
  const rejectInviteMutation = useMutation(() =>
    orpcPrivate.teams.rejectInvite.mutationOptions({
      onSuccess: refreshLimits,
    }),
  )
  const busy = () =>
    acceptInviteMutation.isPending || rejectInviteMutation.isPending
  const failed = () =>
    isAcceptAction() ? acceptInviteMutation.error : rejectInviteMutation.error

  const openConfirmDialog = (teamId: number, isAccept: boolean) => {
    setSelectedTeamId(teamId)
    setIsAcceptAction(isAccept)
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
      setSelectedTeamId(null)
    } catch (error) {
      // Shown in the dialog
      console.error(
        `Failed to ${isAcceptAction() ? 'accept' : 'reject'} invitation:`,
        error,
      )
    }
  }

  return (
    <Column icon={<FaSolidEnvelope />} title="Team Invitations">
      <QueryComponent
        queryOptions={() =>
          orpcPrivate.teamsWS.getUserTeamInvitesWS.experimental_liveOptions({
            context: feedRenewal(
              client,
              orpcPrivate.teamsWS.getUserTeamInvitesWS,
            ),
          })
        }
        loading={ColumnLoading}
        error={ColumnError('Failed to load invitations')}
      >
        {(result) => (
          <Show
            when={result.invites.length > 0}
            fallback={
              <EmptyState title="No pending invitations">
                Team owners can invite you to join their teams.
              </EmptyState>
            }
          >
            <div class="grid gap-2">
              <For each={result.invites}>
                {(invite) => (
                  <ListRow
                    surface="group"
                    trailingAlign="center"
                    title={invite.name}
                    subline="Invited you to join"
                    trailing={
                      <div class="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="accent"
                          disabled={busy()}
                          onClick={() => openConfirmDialog(invite.teamId, true)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy()}
                          onClick={() => openConfirmDialog(invite.teamId, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    }
                  />
                )}
              </For>
            </div>
          </Show>
        )}
      </QueryComponent>

      <ConfirmDialog
        open={selectedTeamId() !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTeamId(null)
        }}
        title={
          isAcceptAction() ? 'Accept Team Invitation' : 'Reject Team Invitation'
        }
        text={
          failed()
            ? `Error: ${failed()!.message}`
            : `Are you sure you want to ${isAcceptAction() ? 'accept' : 'reject'} this invitation?`
        }
        tone={isAcceptAction() ? 'primary' : 'danger'}
        confirmLabel={
          busy()
            ? isAcceptAction()
              ? 'Accepting...'
              : 'Rejecting...'
            : 'Confirm'
        }
        pending={busy()}
        onConfirm={handleConfirm}
      />
    </Column>
  )
}

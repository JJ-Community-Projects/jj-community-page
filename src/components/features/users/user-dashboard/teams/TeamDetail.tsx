import {
  type Component,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from 'solid-js'
import { PageHeader } from '../../../../ui/PageHeader'
import { Button } from '../../../../ui/Button'
import { Section } from '../../../../ui/Tile'
import { Chip } from '../../../../ui/Labels'
import { UserListSection, UserRow } from '../common/UserList.tsx'
import { UserProvider } from '../providers/UserProvider.tsx'
import { TeamDetailsProvider, useTeamDetails } from './TeamDetailsProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { ConfirmDialog } from '../../../../ui/Dialog'
import {
  createModalSignal,
  type ModalSignal,
} from '../../../../../lib/createModalSignal.ts'
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCrown,
  FaSolidUserGroup,
  FaSolidUsers,
} from 'solid-icons/fa'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'

interface TeamDetailProps {
  user: User
  teamId: number
}

export const TeamDetail: Component<TeamDetailProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <TeamDetailsProvider teamId={props.teamId}>
          <TeamDetailContent teamId={props.teamId} />
        </TeamDetailsProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}

const TeamDetailContent: Component<{ teamId: number }> = (props) => {
  const { team, members, leaveTeam, teamId } = useTeamDetails()

  const leaveDialog = createModalSignal()

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam(teamId)
      // Redirect to teams list page after leaving
      window.location.href = `/dashboard/teams`
    } catch (e) {
      console.error('Error leaving team:', e)
      // setError("Failed to leave team");
    }
  }

  const membersList = () => members.data?.members ?? []
  const isLoading = () => members.isLoading

  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title={team.data?.name ?? 'Team'}
        back={{ href: '/dashboard/teams', label: 'Teams' }}
        align="start"
        subtitle={
          <a
            class="text-on-canvas inline-flex items-center gap-1 underline"
            href={`/teams/${team.data?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            jinglejam.ostof.dev/teams/{team.data?.slug}
            <FaSolidArrowUpRightFromSquare class="size-3" aria-hidden="true" />
          </a>
        }
        actions={
          <Button variant="danger" onClick={leaveDialog.open}>
            Leave Team
          </Button>
        }
      />

      <Section level={2} title="Team Information" icon={<FaSolidUserGroup />}>
        <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-fg-muted">Team Name</dt>
            <dd class="font-semibold">{team.data?.name}</dd>
          </div>
          <div>
            <dt class="text-fg-muted">Team Slug</dt>
            <dd class="font-mono">{team.data?.slug}</dd>
          </div>
        </dl>
      </Section>

      <UserListSection
        title="Team Members"
        icon={<FaSolidUsers />}
        items={membersList()}
        loading={isLoading()}
        error={members.error?.message ?? false}
        errorTitle="Error loading members"
        empty={{
          title: 'No members yet',
          text: "This team doesn't have any members currently.",
        }}
        columns={2}
      >
        {(member) => (
          <UserRow
            user={member}
            badge={
              <Show when={member.userId === team.data?.ownerId}>
                <Chip
                  tone="accent"
                  size="sm"
                  icon={<FaSolidCrown class="size-2.5" aria-hidden="true" />}
                >
                  Owner
                </Chip>
              </Show>
            }
          />
        )}
      </UserListSection>

      {/* Leave Team Dialog */}
      <LeaveTeamDialog
        modalSignal={leaveDialog}
        onConfirm={handleLeaveTeam}
        teamName={team.data?.name || ''}
      />
    </div>
  )
}

// Leave Team Dialog Component
const LeaveTeamDialog: Component<{
  modalSignal: ModalSignal
  onConfirm: () => Promise<void>
  teamName: string
}> = (props) => {
  const [isLeaving, setIsLeaving] = createSignal(false)

  const handleConfirm = async () => {
    setIsLeaving(true)
    try {
      await props.onConfirm()
      props.modalSignal.close()
    } catch (e) {
      console.error('Error in leave confirmation:', e)
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <ConfirmDialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title="Leave Team"
      text={`Are you sure you want to leave the team "${props.teamName}"? You will lose access to all team resources.`}
      confirmLabel={isLeaving() ? 'Leaving...' : 'Leave Team'}
      pending={isLeaving()}
      onConfirm={handleConfirm}
    />
  )
}

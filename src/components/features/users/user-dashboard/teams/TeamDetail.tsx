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
import { UserProvider } from '../providers/UserProvider.tsx'
import { TeamDetailsProvider, useTeamDetails } from './TeamDetailsProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { Dialog } from '@kobalte/core/dialog'
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
  const hasMembers = () => membersList().length > 0
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

      <div class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line overflow-hidden bg-linear-to-b ring-1">
        <div class="fl-p-4/8 space-y-6">
          {/* Team Information */}
          <div class="border-line border-b pb-6">
            <h3 class="text-fg-muted mb-4 flex items-center gap-2 text-lg font-semibold">
              <FaSolidUserGroup class="text-fg-muted h-5 w-5" />
              Team Information
            </h3>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <h4 class="text-fg-muted text-sm font-medium">Team Name</h4>
                <p class="text-fg font-medium">{team.data?.name}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-fg-muted text-sm font-medium">Team Slug</h4>
                <p class="bg-surface-2 text-fg inline-block rounded-lg px-3 py-1 font-mono text-sm">
                  {team.data?.slug}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <h4 class="text-fg-muted flex items-center gap-2 text-sm font-semibold">
                <FaSolidUsers class="text-primary h-4 w-4" />
                Team Members
              </h4>
            </div>

            <Switch>
              <Match when={isLoading()}>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
                  <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
                  <div class="h-16 animate-pulse rounded-xl bg-black/10 shadow-xs"></div>
                </div>
              </Match>

              <Match when={!hasMembers()}>
                <div class="flex flex-col items-center justify-center px-4 py-12">
                  <div class="from-primary-400 to-primary-500 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br shadow-lg">
                    <FaSolidUsers class="h-8 w-8 text-white" />
                  </div>
                  <h4 class="text-fg-muted mb-2 text-xl font-semibold">
                    No members yet
                  </h4>
                  <p class="text-fg-muted max-w-md text-center leading-relaxed">
                    This team doesn't have any members currently.
                  </p>
                </div>
              </Match>

              <Match when={hasMembers()}>
                <div class="fl-gap-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={membersList()}>
                    {(member) => (
                      <div class="rounded-group bg-surface-strong text-fg ring-line group hover:bg-surface flex flex-col gap-4 p-2 ring-1 transition-colors">
                        <div class="flex flex-1 items-center gap-3">
                          {/* Avatar placeholder */}
                          <div class="from-primary-400 to-primary-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br shadow-xs">
                            <span class="text-sm font-semibold text-white">
                              {(member.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>

                          {/* Member info */}
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <p class="text-fg-muted block truncate text-sm font-semibold">
                                {member.username || 'Unknown User'}
                              </p>
                              <Show when={member.userId === team.data?.ownerId}>
                                <div class="bg-warning-100 text-warning-700 flex items-center gap-1 rounded-full px-2 py-1">
                                  <FaSolidCrown class="h-3 w-3" />
                                  <span class="text-xs font-medium">Owner</span>
                                </div>
                              </Show>
                            </div>
                          </div>
                        </div>
                        <a
                          class="text-primary inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:underline"
                          href={`/${member.tiltifySlug}`}
                        >
                          {member.tiltifySlug}{' '}
                          <FaSolidArrowUpRightFromSquare class="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </For>
                </div>
              </Match>
            </Switch>
          </div>
        </div>
      </div>

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
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
    >
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <Dialog.Content class="rounded-tile bg-surface-strong text-fg shadow-tile-hover ring-line w-full max-w-md p-6 ring-1">
            <Dialog.Title class="mb-4 text-xl font-bold">
              Leave Team
            </Dialog.Title>
            <Dialog.Description class="text-fg-muted mb-4">
              Are you sure you want to leave the team "{props.teamName}"? You
              will lose access to all team resources.
            </Dialog.Description>

            <div class="mt-4 flex justify-end gap-2">
              <button
                type="button"
                class="border-line-strong hover:bg-surface rounded-md border px-4 py-2"
                onClick={props.modalSignal.close}
                disabled={isLeaving()}
              >
                Cancel
              </button>
              <button
                type="button"
                class="bg-danger hover:bg-danger-600 rounded-md px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleConfirm}
                disabled={isLeaving()}
              >
                {isLeaving() ? 'Leaving...' : 'Leave Team'}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  )
}

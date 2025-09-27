import { type Component, createSignal, For, Match, Switch } from 'solid-js'
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
  FaSolidChevronLeft,
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
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      {/* Team Header */}
      <div class="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg">
        <div class="~p-4/8">
          <div class="flex flex-col gap-4">
            <div>
              <a
                href={`/dashboard/teams`}
                class="flex flex-row items-center gap-1 text-primary transition-colors duration-200 hover:underline"
              >
                <FaSolidChevronLeft class="h-4 w-4" />
                <span class="text-sm font-medium">Back to Teams</span>
              </a>
            </div>

            <div class="flex items-start justify-between">
              <div class="flex-1 space-y-3">
                <div>
                  <h1 class="mb-2 text-2xl font-bold text-neutral-800">
                    {team.data?.name}
                  </h1>
                  <a
                    class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:underline"
                    href={`/teams/${team.data?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    jj.ostof.dev/teams/{team.data?.slug}
                    <FaSolidArrowUpRightFromSquare class="h-3 w-3" />
                  </a>
                </div>
              </div>

              <button
                class="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 font-medium text-white shadow-sm outline-none transition-all duration-200 hover:bg-danger-600 hover:shadow-md focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-white active:scale-95"
                onClick={leaveDialog.open}
              >
                <span class="text-sm font-medium">Leave Team</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg">
        <div class="space-y-6 ~p-4/8">
          {/* Team Information */}
          <div class="border-b border-neutral-200 pb-6">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-700">
              <FaSolidUserGroup class="h-5 w-5 text-neutral-600" />
              Team Information
            </h3>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-neutral-600">Team Name</h4>
                <p class="font-medium text-neutral-800">{team.data?.name}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-neutral-600">Team Slug</h4>
                <p class="inline-block rounded-lg bg-neutral-100 px-3 py-1 font-mono text-sm text-neutral-800">
                  {team.data?.slug}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <h4 class="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <FaSolidUsers class="h-4 w-4 text-primary" />
                Team Members
              </h4>
              {hasMembers() && (
                <div class="rounded-full bg-gradient-to-r from-primary-100 to-primary-200 px-3 py-1">
                  <span class="text-xs font-medium text-primary-700">
                    {membersList().length} member
                    {membersList().length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <Switch>
              <Match when={isLoading()}>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
                  <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
                  <div class="h-16 animate-pulse rounded-xl bg-neutral-200 shadow-sm"></div>
                </div>
              </Match>

              <Match when={!hasMembers()}>
                <div class="flex flex-col items-center justify-center px-4 py-12">
                  <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg">
                    <FaSolidUsers class="h-8 w-8 text-white" />
                  </div>
                  <h4 class="mb-2 text-xl font-semibold text-neutral-700">
                    No members yet
                  </h4>
                  <p class="max-w-md text-center leading-relaxed text-neutral-600">
                    This team doesn't have any members currently.
                  </p>
                </div>
              </Match>

              <Match when={hasMembers()}>
                <div class="grid grid-cols-1 ~gap-3/4 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={membersList()}>
                    {(member) => (
                      <div class="group relative flex items-center rounded-xl border-2 border-primary-100 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg">
                        <div class="flex flex-1 items-center gap-3">
                          {/* Avatar placeholder */}
                          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-sm">
                            <span class="text-sm font-semibold text-white">
                              {(member.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>

                          {/* Member info */}
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <p class="block truncate text-sm font-semibold text-neutral-700">
                                {member.username || 'Unknown User'}
                              </p>
                              {member.userId === team.data?.ownerId && (
                                <div class="flex items-center gap-1 rounded-full bg-warning-100 px-2 py-1 text-warning-700">
                                  <FaSolidCrown class="h-3 w-3" />
                                  <span class="text-xs font-medium">Owner</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subtle hover effect */}
                        <div class="pointer-events-none absolute inset-0 rounded-xl bg-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>
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
          <Dialog.Content class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title class="mb-4 text-xl font-bold">
              Leave Team
            </Dialog.Title>
            <Dialog.Description class="mb-4 text-neutral-600">
              Are you sure you want to leave the team "{props.teamName}"? You
              will lose access to all team resources.
            </Dialog.Description>

            <div class="mt-4 flex justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
                onClick={props.modalSignal.close}
                disabled={isLeaving()}
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-md bg-danger px-4 py-2 text-white hover:bg-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
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

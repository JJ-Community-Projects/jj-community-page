import { type Component, createSignal, For, Show } from 'solid-js'
import { QueryClientProvider, useMutation, useQuery, useQueryClient, } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import type { User } from '../../../../../lib/auth/User.ts'
import { Dialog } from '@kobalte/core/dialog'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { CreateScheduleDialog } from './CreateScheduleDialog.tsx'
import { ScheduleHeader } from './ScheduleHeader.tsx'
import {
  FaRegularEye,
  FaRegularEyeSlash,
  FaRegularPenToSquare,
  FaRegularStar,
  FaSolidStar,
  FaSolidTrash,
} from 'solid-icons/fa'
import { QueryClient } from '@tanstack/query-core'

interface SchedulesListProps {
  user: User
}

export const SchedulesList: Component<SchedulesListProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SchedulesListContent user={props.user} />
    </QueryClientProvider>
  )
}

const SchedulesListContent: Component<{ user: User }> = (props) => {
  const queryClient = useQueryClient()
  const schedules = orpcPrivate.schedules
  const [isCreateDialogOpen, setIsCreateDialogOpen] = createSignal(false)

  // Query for user schedules
  const schedulesQuery = useQuery(() =>
    schedules.getSchedules.queryOptions({
      staleTime: 30 * 1000, // 30 seconds
    }),
  )

  return (
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <ScheduleHeader onAddSchedule={() => setIsCreateDialogOpen(true)} />

      <Show
        when={schedulesQuery.data && schedulesQuery.data.length > 0}
        fallback={
          <div class="rounded-xl border-2 border-accent-100 bg-white p-8 text-center shadow-md">
            <Show when={schedulesQuery.isLoading}>
              <div class="flex flex-col items-center gap-4">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                <p class="font-medium text-gray-600">
                  Loading your schedules...
                </p>
              </div>
            </Show>
            <Show when={!schedulesQuery.isLoading}>
              <div class="flex flex-col items-center gap-6">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100">
                  <svg
                    class="h-8 w-8 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div class="space-y-2">
                  <h3 class="font-bold text-gray-800 ~text-lg/xl">
                    No Schedules found
                  </h3>
                  <p class="mx-auto max-w-md leading-relaxed text-gray-600">
                    Create your first schedule.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  class="transform rounded-lg bg-accent px-6 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95"
                >
                  Create Your First Schedule
                </button>
              </div>
            </Show>
          </div>
        }
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <For each={schedulesQuery.data}>
            {(schedule) => <SchedulesListItem schedule={schedule} />}
          </For>
        </div>
      </Show>

      <CreateScheduleDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        onSuccess={async () => {
          // Invalidate schedules query to refresh the list
          await queryClient.invalidateQueries({
            queryKey: schedules.getSchedules.queryKey(),
          })
        }}
      />
    </div>
  )
}

const SchedulesListItem: Component<{
  schedule: {
    id: number
    title: string
    year: number
    visible: boolean
    primary: boolean
    slug: string
  }
}> = (props) => {
  return (
    <div class="group rounded-xl border-2 border-primary-200 bg-white p-6 shadow-md transition-all duration-300">
      {/* Status badges */}
      <div class="mb-3 flex items-center gap-2">
        <Show when={props.schedule.primary}>
          <span class="rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-700">
            Primary {props.schedule.year}
          </span>
        </Show>
        <span
          class={`rounded-full px-2 py-1 text-xs font-medium ${
            props.schedule.visible
              ? 'bg-success-100 text-success-700'
              : 'bg-neutral-200 text-neutral-700'
          }`}
        >
          {props.schedule.visible ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Schedule title */}
      <h3 class="mb-3 font-bold text-gray-800 transition-colors ~text-lg/xl group-hover:text-primary-600">
        {props.schedule.title}
      </h3>

      {/* Schedule details */}
      <div class="mb-4 space-y-1">
        <p class="text-sm text-gray-600">
          <span class="font-medium">Year:</span> {props.schedule.year}
        </p>
        <a
          href={`/schedules/${props.schedule.slug}`}
          class="block text-sm font-medium text-primary transition-colors hover:text-primary-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          /schedules/{props.schedule.slug} ↗
        </a>
      </div>

      {/* Action buttons */}
      <div class="mt-4 flex flex-row items-center justify-center gap-2">
        <a
          href={`/dashboard/schedules/${props.schedule.id}/edit`}
          class="transform rounded-lg bg-accent p-2 text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95"
          title="Edit Schedule"
        >
          <FaRegularPenToSquare class="h-4 w-4" />
        </a>
        <SchedulePrimaryButton schedule={props.schedule} />
        <ScheduleVisibilityButton schedule={props.schedule} />
        <ScheduleDeleteButton schedule={props.schedule} />
      </div>
    </div>
  )
}

const SchedulePrimaryButton: Component<{
  schedule: {
    id: number
    title: string
    year: number
    visible: boolean
    primary: boolean
  }
}> = (props) => {
  const queryClient = useQueryClient()
  const schedules = orpcPrivate.schedules

  const setPrimaryMutation = useMutation(() =>
    schedules.setPrimary.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({
          queryKey: schedules.getSchedules.queryKey(),
        })
      },
    }),
  )
  const removePrimaryMutation = useMutation(() =>
    schedules.removePrimary.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({
          queryKey: schedules.getSchedules.queryKey(),
        })
      },
    }),
  )

  const handleSetPrimary = async () => {
    try {
      if (props.schedule.primary) {
        await removePrimaryMutation.mutateAsync({
          scheduleId: props.schedule.id,
        })
      } else {
        await setPrimaryMutation.mutateAsync({
          scheduleId: props.schedule.id,
        })
      }
    } catch (error) {
      console.error('Failed to set schedule as primary:', error)
    }
  }

  return (
    <button
      onClick={() => handleSetPrimary()}
      disabled={setPrimaryMutation.isPending || removePrimaryMutation.isPending}
      class="transform rounded-lg bg-accent p-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      title={
        props.schedule.primary ? 'Remove Primary Schedule' : 'Set as Primary'
      }
    >
      {props.schedule.primary ? (
        <FaSolidStar class="h-4 w-4" />
      ) : (
        <FaRegularStar class="h-4 w-4" />
      )}
    </button>
  )
}

const ScheduleVisibilityButton: Component<{
  schedule: {
    id: number
    title: string
    year: number
    visible: boolean
    primary: boolean
  }
}> = (props) => {
  const queryClient = useQueryClient()
  const schedules = orpcPrivate.schedules

  const toggleVisibilityMutation = useMutation(() =>
    schedules.toggleVisibility.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({
          queryKey: schedules.getSchedules.queryKey(),
        })
      },
    }),
  )

  const handleToggleVisibility = async () => {
    try {
      await toggleVisibilityMutation.mutateAsync({
        scheduleId: props.schedule.id,
      })
    } catch (error) {
      console.error('Failed to toggle schedule visibility:', error)
    }
  }

  return (
    <button
      onClick={() => handleToggleVisibility()}
      disabled={toggleVisibilityMutation.isPending}
      class="transform rounded-lg bg-primary p-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-600 hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      title={props.schedule.visible ? 'Make Private' : 'Make Public'}
    >
      {props.schedule.visible ? (
        <FaRegularEye class="h-4 w-4" />
      ) : (
        <FaRegularEyeSlash class="h-4 w-4" />
      )}
    </button>
  )
}

const ScheduleDeleteButton: Component<{
  schedule: {
    id: number
    title: string
    year: number
    visible: boolean
    primary: boolean
    slug: string
  }
}> = (props) => {
  const queryClient = useQueryClient()
  const schedules = orpcPrivate.schedules
  const modal = createModalSignal()

  const deleteScheduleMutation = useMutation(() =>
    schedules.delete.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({
          queryKey: schedules.getSchedules.queryKey(),
        })
      },
    }),
  )

  const handleDelete = async () => {
    try {
      await deleteScheduleMutation.mutateAsync(props.schedule.id)
      modal.close()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  return (
    <>
      <button
        onClick={modal.open}
        disabled={deleteScheduleMutation.isPending}
        class="transform rounded-lg bg-danger p-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-danger-600 hover:shadow-md focus:ring-2 focus:ring-danger focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        title="Delete Schedule"
      >
        <FaSolidTrash class="h-4 w-4" />
      </button>

      <Dialog open={modal.isOpen()} onOpenChange={modal.setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <Dialog.Content class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title class="mb-4 text-xl font-bold">
                Delete Schedule
              </Dialog.Title>
              <Dialog.Description class="mb-4 text-gray-600">
                Are you sure you want to delete "{props.schedule.title}"? This
                action cannot be undone.
              </Dialog.Description>

              <Show when={deleteScheduleMutation.error}>
                <div class="mb-4 text-red-500">
                  {deleteScheduleMutation.error?.message ||
                    'Failed to delete schedule'}
                </div>
              </Show>

              <div class="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  onClick={modal.close}
                  disabled={deleteScheduleMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={deleteScheduleMutation.isPending}
                >
                  {deleteScheduleMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

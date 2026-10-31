import { type Component, createSignal, For, Show } from 'solid-js'
import {
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import type { User } from '../../../../../lib/auth/User.ts'
import { createModalSignal } from '../../../../../lib/createModalSignal.ts'
import { CreateScheduleDialog } from './CreateScheduleDialog.tsx'
import { ScheduleHeader } from './ScheduleHeader.tsx'
import {
  FaRegularCalendar,
  FaRegularEye,
  FaRegularEyeSlash,
  FaRegularPenToSquare,
  FaRegularStar,
  FaSolidStar,
  FaSolidArrowUpRightFromSquare,
  FaSolidTrash,
} from 'solid-icons/fa'
import { Tile } from '../../../../ui/Tile'
import { Button, IconButton } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { Chip } from '../../../../ui/Labels'
import { Alert, EmptyState, Spinner } from '../../../../ui/Status'
import { QueryClient } from '@tanstack/query-core'
import { useSchedule } from '../teams/useSchedule.ts'

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
  const { schedulesQuery } = useSchedule()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = createSignal(false)

  return (
    <div class="flex flex-col gap-3">
      <ScheduleHeader
        schedules={schedulesQuery.data ?? []}
        onAddSchedule={() => setIsCreateDialogOpen(true)}
      />

      <Show
        when={schedulesQuery.data && schedulesQuery.data.length > 0}
        fallback={
          <Tile>
            <Show
              when={!schedulesQuery.isLoading}
              fallback={
                <div class="flex justify-center py-6">
                  <Spinner label="Loading your schedules..." class="text-fg-muted" />
                </div>
              }
            >
              <EmptyState
                level={3}
                icon={<FaRegularCalendar />}
                title="No Schedules found"
                action={
                  <Button
                    variant="accent"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Create Your First Schedule
                  </Button>
                }
              >
                Create your first schedule.
              </EmptyState>
            </Show>
          </Tile>
        }
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
            queryKey: orpcPrivate.schedules.getSchedules.queryKey(),
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
    <Tile class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <Show when={props.schedule.primary}>
          <Chip tone="accent" size="sm">
            Primary {props.schedule.year}
          </Chip>
        </Show>
        <Chip tone={props.schedule.visible ? 'primary' : 'neutral'} size="sm">
          {props.schedule.visible ? 'Public' : 'Private'}
        </Chip>
      </div>

      {/* The browser tests find the card as the parent of this heading */}
      <h3 class="text-lg font-semibold text-balance">{props.schedule.title}</h3>

      <div class="text-sm">
        <p class="text-fg-muted">Year {props.schedule.year}</p>
        <a
          href={`/schedules/${props.schedule.slug}`}
          class="text-accent-text inline-flex items-center gap-1 font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          /schedules/{props.schedule.slug}
          <FaSolidArrowUpRightFromSquare class="size-3" aria-hidden="true" />
        </a>
      </div>

      <div class="mt-1 flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="accent"
          href={`/dashboard/schedules/${props.schedule.id}/edit`}
          aria-label="Edit Schedule"
          title="Edit Schedule"
        >
          <FaRegularPenToSquare class="size-3.5" aria-hidden="true" />
          Edit
        </Button>
        <SchedulePrimaryButton schedule={props.schedule} />
        <ScheduleVisibilityButton schedule={props.schedule} />
        <ScheduleDeleteButton schedule={props.schedule} />
      </div>
    </Tile>
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

  const label = () =>
    props.schedule.primary ? 'Remove Primary Schedule' : 'Set as Primary'

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
    <IconButton
      size="sm"
      variant="accent"
      onClick={() => handleSetPrimary()}
      disabled={setPrimaryMutation.isPending || removePrimaryMutation.isPending}
      aria-label={label()}
      title={label()}
    >
      {props.schedule.primary ? (
        <FaSolidStar class="size-3.5" aria-hidden="true" />
      ) : (
        <FaRegularStar class="size-3.5" aria-hidden="true" />
      )}
    </IconButton>
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

  const label = () => (props.schedule.visible ? 'Make Private' : 'Make Public')

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
    <IconButton
      size="sm"
      variant="primary"
      onClick={() => handleToggleVisibility()}
      disabled={toggleVisibilityMutation.isPending}
      aria-label={label()}
      title={label()}
    >
      {props.schedule.visible ? (
        <FaRegularEye class="size-3.5" aria-hidden="true" />
      ) : (
        <FaRegularEyeSlash class="size-3.5" aria-hidden="true" />
      )}
    </IconButton>
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
      <IconButton
        size="sm"
        variant="danger"
        onClick={modal.open}
        disabled={deleteScheduleMutation.isPending}
        aria-label="Delete Schedule"
        title="Delete Schedule"
      >
        <FaSolidTrash class="size-3.5" aria-hidden="true" />
      </IconButton>

      <Dialog
        open={modal.isOpen()}
        onOpenChange={modal.setOpen}
        title="Delete Schedule"
        size="sm"
        footer={
          <>
            <Button
              size="sm"
              onClick={modal.close}
              disabled={deleteScheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <div class="flex flex-col gap-3 text-sm">
          <p>
            Are you sure you want to delete "{props.schedule.title}"? This
            action cannot be undone.
          </p>
          <Show when={deleteScheduleMutation.error}>
            <Alert tone="danger">
              {deleteScheduleMutation.error?.message ||
                'Failed to delete schedule'}
            </Alert>
          </Show>
        </div>
      </Dialog>
    </>
  )
}

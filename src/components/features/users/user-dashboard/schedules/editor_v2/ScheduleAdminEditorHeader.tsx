import { type Component, createEffect, createSignal, on, onCleanup, Show } from 'solid-js'
import { useScheduleEditor2 } from './ScheduleEditorProvider.tsx'
import { createModalSignal } from '../../../../../../lib/createModalSignal.ts'
import { ConfirmDialog } from '../../../../../ui/Dialog'
import { PageHeader } from '../../../../../ui/PageHeader'
import { Button } from '../../../../../ui/Button'
import { Chip } from '../../../../../ui/Labels'
import { Alert } from '../../../../../ui/Status'
import { FaRegularEye, FaRegularEyeSlash } from 'solid-icons/fa'
import { DateTime } from 'luxon'

export const ScheduleAdminEditorHeader: Component = () => {
  const {
    state,
    noAccess,
    publishDraft,
    publishDraftMutation,
    deleteSchedule,
    deleteMutation,
  } = useScheduleEditor2()
  const lastUpdate = () => {
    const scheduleUpdate = state.schedule?.updatedAt

    const streamUpdated = state.streams?.map((s) => s.updatedAt) ?? []

    const dates = [scheduleUpdate, ...streamUpdated]

    return dates.reduce((a, b) => {
      if (!a && !b) {
        return undefined
      }
      if ((a?.getTime() ?? 0) > (b?.getTime() ?? 0)) {
        return a
      }
      return b
    })
  }

  const lastUpdateStr = () => {
    const date = lastUpdate()
    if (!date) {
      return undefined
    }
    return DateTime.fromJSDate(date).toLocaleString({
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
  }

  const showSaveDialog = createModalSignal()
  const showDeleteDialog = createModalSignal()
  const [saveSuccess, setSaveSuccess] = createSignal(false)
  let successTimer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(successTimer))

  const handleSaveSchedule = async () => {
    try {
      await publishDraft()
      showSaveDialog.close()
      setSaveSuccess(true)
      clearTimeout(successTimer)
      successTimer = setTimeout(() => setSaveSuccess(false), 4000)
    } catch (error) {
      console.error('Error in handleSaveSchedule:', error)
    }
  }

  const handleDeleteSchedule = async () => {
    await deleteSchedule()
  }

  createEffect(
    on(
      () => deleteMutation.error,
      (e) => {
        if (!deleteMutation.isIdle) {
          if (e) {
            console.error('Error deleting schedule', e)
          } else {
            window.location.href = '/dashboard/schedules'
            showDeleteDialog.close()
          }
        }
      },
    ),
  )

  return (
    <>
      <div class="flex flex-col gap-3">
        <PageHeader
          title={state.schedule?.title || 'Schedule Editor'}
          back={{ href: '/dashboard/schedules', label: 'Back to Schedules' }}
          align="start"
          subtitle={
            <span class="text-on-canvas-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Show when={state.schedule}>
                {(schedule) => (
                  <Chip
                    tone="canvas"
                    icon={
                      schedule().visible ? (
                        <FaRegularEye class="size-3" aria-hidden="true" />
                      ) : (
                        <FaRegularEyeSlash class="size-3" aria-hidden="true" />
                      )
                    }
                  >
                    {schedule().visible ? 'Schedule Visible' : 'Schedule Hidden'}
                  </Chip>
                )}
              </Show>
              <Show when={lastUpdateStr()}>
                {(date) => <span>Last saved {date()}</span>}
              </Show>
            </span>
          }
          actions={
            <>
              <Button
                variant="canvas"
                class="text-danger-text"
                onClick={showDeleteDialog.open}
              >
                Delete Schedule
              </Button>
              <Button variant="accent" onClick={showSaveDialog.open}>
                Publish Schedule
              </Button>
            </>
          }
        />

        <Alert>
          The schedule is continuously saved automatically. To make your changes
          visible to everyone, press <strong>Publish Schedule</strong>.
        </Alert>

        <Show when={noAccess()}>
          <Alert tone="danger">
            You no longer have access to edit this schedule. Live updates have
            stopped and changes can't be saved.
          </Alert>
        </Show>

        {/* Action status feedback */}
        <Show when={publishDraftMutation.isPending}>
          <Alert>Publishing schedule…</Alert>
        </Show>
        <Show when={publishDraftMutation.isError}>
          <Alert tone="danger">Error: {publishDraftMutation.error?.message}</Alert>
        </Show>
        <Show when={deleteMutation.isPending}>
          <Alert>Deleting schedule…</Alert>
        </Show>
        <Show when={deleteMutation.isError}>
          <Alert tone="danger">Error: {deleteMutation.error?.message}</Alert>
        </Show>
        <Show when={saveSuccess()}>
          <Alert tone="success">Schedule published.</Alert>
        </Show>
      </div>

      <ConfirmDialog
        open={showSaveDialog.isOpen()}
        onOpenChange={showSaveDialog.setOpen}
        title="Save Schedule"
        text="Are you sure you want to save this schedule? All changes will be publicly visible if the schedule is set to visible."
        tone="primary"
        pending={publishDraftMutation.isPending}
        onConfirm={handleSaveSchedule}
        onCancel={showSaveDialog.close}
      />

      <ConfirmDialog
        open={showDeleteDialog.isOpen()}
        onOpenChange={showDeleteDialog.setOpen}
        title="Delete Schedule"
        text="Are you sure you want to delete this schedule? This action cannot be undone."
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onConfirm={handleDeleteSchedule}
        onCancel={showDeleteDialog.close}
      />
    </>
  )
}

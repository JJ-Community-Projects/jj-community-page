import { type Component, createEffect, createSignal, on, Show } from 'solid-js'
import { useScheduleEditor2 } from './ScheduleEditorProvider.tsx'
import { createModalSignal } from '../../../../../../lib/createModalSignal.ts'
import { ConfirmationDialog } from '../../../../../common/dialogs/ConfirmationDialog.tsx'
import './successAnimation.css'
import { Transition } from 'solid-transition-group'
import { twMerge } from 'tailwind-merge'
import { FaSolidChevronLeft } from 'solid-icons/fa'
import { DateTime } from 'luxon'
import { UserDashboardFeedback } from '../../UserDashboardFeedback.tsx'

export const ScheduleAdminEditorHeader: Component = () => {
  const {
    state,
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
      return 'no date'
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

  const handleSaveSchedule = async () => {
    try {
      await publishDraft()
      showSaveDialog.close()
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
      <div class="mb-6 rounded-2xl bg-white p-6 shadow-xl transition-transform">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a
              href={`/dashboard/schedules`}
              class="flex flex-row items-center gap-1 text-primary hover:underline"
            >
              <FaSolidChevronLeft />
              <p>Back to Dahboard</p>
            </a>
            <h1 class="text-2xl font-bold">Schedule Editor</h1>
          </div>
          <div class="flex gap-2">
            <button
              onClick={showDeleteDialog.open}
              class="rounded-lg bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-600"
            >
              Delete Schedule
            </button>
            <button
              onClick={showSaveDialog.open}
              class="rounded-lg bg-accent px-4 py-2 text-white transition-all hover:bg-accent-600"
            >
              Publish Schedule
            </button>
          </div>
        </div>

        {/* Added informational text */}
        <div class="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <p>
            The schedule is continuously saved automatically. To make your
            changes visible to everyone, press the{' '}
            <strong>Publish Schedule</strong> button.
            <br />
            <span>{lastUpdateStr()}</span>
          </p>
        </div>

        {/* Label showing if the schedule is visible or not */}
        <div class="mt-2 flex items-center">
          <div
            class={twMerge(
              state.schedule?.visible && 'bg-green-100 text-green-800',
              !state.schedule?.visible && 'bg-red-100 text-red-800',
              'rounded-full px-2 py-1 text-xs',
            )}
          >
            {state.schedule?.visible ? 'Schedule Visible' : 'Schedule Hidden'}
          </div>
        </div>

        {/* Action status feedback */}
        <Show when={publishDraftMutation.isPending}>
          <div class="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-700">
            <p>Saving schedule...</p>
          </div>
        </Show>
        <Show when={publishDraftMutation.isError}>
          <div class="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
            <p>Error: {publishDraftMutation.error?.message}</p>
          </div>
        </Show>
        <Show when={deleteMutation.isPending}>
          <div class="mt-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-700">
            <p>Deleting schedule...</p>
          </div>
        </Show>
        <Show when={deleteMutation.isError}>
          <div class="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
            <p>Error: {deleteMutation.error?.message}</p>
          </div>
        </Show>
        <Transition
          onEnter={(el) => {
            // starting state
            // @ts-ignore
            el.style.height = '0px'
            // @ts-ignore
            el.style.opacity = '0'
            // measure
            const full = el.scrollHeight
            requestAnimationFrame(() => {
              // @ts-ignore
              el.style.transition = 'height 0.3s ease, opacity 0.3s ease'
              // @ts-ignore
              el.style.height = `${full}px`
              // @ts-ignore
              el.style.opacity = '1'
            })
          }}
          onExit={(el) => {
            // from current to zero
            // @ts-ignore
            el.style.height = `${el.clientHeight}px`
            requestAnimationFrame(() => {
              // @ts-ignore
              el.style.transition = 'height 0.3s ease, opacity 0.3s ease'
              // @ts-ignore
              el.style.height = '0px'
              // @ts-ignore
              el.style.opacity = '0'
            })
          }}
        >
          <Show when={saveSuccess()}>
            <div class="success-message mt-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">
              <div class="success-background"></div>
              <p class="success-text">Schedule saved successfully!</p>
            </div>
          </Show>
        </Transition>
        <UserDashboardFeedback/>
      </div>

      <ConfirmationDialog
        isOpen={showSaveDialog.isOpen()}
        onOpenChange={showSaveDialog.setOpen}
        title="Save Schedule"
        text="Are you sure you want to save this schedule? All changes will be publicly visible if the schedule is set to visible."
        onConfirm={handleSaveSchedule}
        onCancel={showSaveDialog.close}
      />

      <ConfirmationDialog
        isOpen={showDeleteDialog.isOpen()}
        onOpenChange={showDeleteDialog.setOpen}
        title="Delete Schedule"
        text="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDeleteSchedule}
        onCancel={showDeleteDialog.close}
      />
    </>
  )
}

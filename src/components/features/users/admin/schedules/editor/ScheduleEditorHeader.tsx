import type {Component} from "solid-js";
import {createSignal, Show} from "solid-js";
import {useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {createModalSignal} from "../../../../../../lib/createModalSignal.ts";
import {ConfirmationDialog} from "../../../../../common/dialogs/ConfirmationDialog.tsx";
import "./successAnimation.css";
import {Transition} from "solid-transition-group";
import {twMerge} from "tailwind-merge";


export const ScheduleEditorHeader: Component = () => {
  const {
    local,
    username,
    saveSchedule,
    deleteSchedule,
    action
  } = useScheduleEditor();

  const showSaveDialog = createModalSignal();
  const showDeleteDialog = createModalSignal();
  const [saveSuccess, setSaveSuccess] = createSignal(false);

  const handleSaveSchedule = async () => {
    try {
      const result = await saveSchedule();
      if (!result.error) {
        console.log("Schedule saved successfully!");
        setSaveSuccess(true);
        // Reset the success message after 4 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 4000);
      }
      showSaveDialog.close();
    } catch (error) {
      console.error("Error in handleSaveSchedule:", error);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      const result = await deleteSchedule();
      if (!result.error) {
        console.log("Schedule deleted successfully!");
        // Redirect to schedules list or another appropriate page
        window.location.href = "/admin/schedules";
      }
      showDeleteDialog.close();
    } catch (error) {
      console.error("Error in handleDeleteSchedule:", error);
    }
  };


  return (
    <>

      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 transition-transform">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <a href={`/admin/schedules`} class="text-primary hover:underline">
              &larr; Back to Admin
            </a>
            <h1 class="text-2xl font-bold">Schedule Editor</h1>
          </div>
          <div class="flex gap-2">
            <button
              onClick={showDeleteDialog.open}
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              Delete Schedule
            </button>
            <button
              onClick={showSaveDialog.open}
              class="bg-accent hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              Publish Schedule
            </button>
          </div>
        </div>

        {/* Added informational text */}
        <div class="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <p>The schedule is continuously saved automatically. To make your changes visible to all users, press
            the <strong>Publish Schedule</strong> button.</p>
        </div>

        {/* Label showing if the schedule is visible or not */}
        <div class="mt-2 flex items-center">
          <div class={twMerge(
            local.visible && 'bg-green-100 text-green-800',
            !local.visible && 'bg-red-100 text-red-800',
            'text-xs px-2 py-1 rounded-full'
          )}>
            {local.visible ? 'Schedule Visible' : 'Schedule Hidden'}
          </div>
        </div>

        {/* Action status feedback */}
        <Show when={action.saveSchedule.actionInProgress}>
          <div class="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            <p>Saving schedule...</p>
          </div>
        </Show>
        <Show when={action.saveSchedule.lastErrorMessage}>
          <div class="mt-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
            <p>Error: {action.saveSchedule.lastErrorMessage}</p>
          </div>
        </Show>
        <Show when={action.deleteSchedule.actionInProgress}>
          <div class="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            <p>Deleting schedule...</p>
          </div>
        </Show>
        <Show when={action.deleteSchedule.lastErrorMessage}>
          <div class="mt-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
            <p>Error: {action.deleteSchedule.lastErrorMessage}</p>
          </div>
        </Show>
        <Transition
          onEnter={(el) => {
            // starting state
            // @ts-ignore
            el.style.height = "0px";
            // @ts-ignore
            el.style.opacity = "0";
            // measure
            const full = el.scrollHeight;
            requestAnimationFrame(() => {
              // @ts-ignore
              el.style.transition = "height 0.3s ease, opacity 0.3s ease";
              // @ts-ignore
              el.style.height = `${full}px`;
              // @ts-ignore
              el.style.opacity = "1";
            });
          }}
          onExit={(el) => {
            // from current to zero
            // @ts-ignore
            el.style.height = `${el.clientHeight}px`;
            requestAnimationFrame(() => {
              // @ts-ignore
              el.style.transition = "height 0.3s ease, opacity 0.3s ease";
              // @ts-ignore
              el.style.height = "0px";
              // @ts-ignore
              el.style.opacity = "0";
            });
          }}
        >
          <Show when={saveSuccess()}>
            <div class="mt-2 p-2 bg-green-50 text-green-700 rounded-lg text-sm success-message">
              <div class="success-background"></div>
              <p class="success-text">Schedule saved successfully!</p>
            </div>
          </Show>
        </Transition>
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

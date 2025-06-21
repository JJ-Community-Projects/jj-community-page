import {type Component, For, Show} from "solid-js";
import {UserSchedulesProvider, useUserSchedules} from "../providers/UserSchedulesProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {Dialog} from "@kobalte/core/dialog";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {FaRegularStar, FaSolidStar, FaRegularEye, FaRegularEyeSlash, FaRegularPenToSquare, FaSolidTrash} from "solid-icons/fa";

interface SchedulesListProps {
  user: User
}

export const SchedulesList: Component<SchedulesListProps> = (props) => {
  return (
    <UserSchedulesProvider user={props.user}>
      <SchedulesListContent/>
    </UserSchedulesProvider>
  );
};

const SchedulesListContent: Component = () => {
  const {local, createSchedule, toggleVisibility, action} = useUserSchedules();
  const addSchedule = async () => {
    try {
      await createSchedule();
    } catch (error) {
      console.error("Failed to create schedule:", error);
      // Error is already handled by the action state
    }
  };

  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex flex-col gap-4">
          <div>
            <a href={`/admin`} class="text-primary hover:underline">
              &larr; Back to Admin
            </a>
          </div>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Your Schedules</h2>
            <button
              class="bg-accent hover:bg-accent-400 text-white px-4 py-2 rounded-lg transition-all"
              onClick={addSchedule}
              disabled={action.createSchedule.actionInProgress}
            >
              {action.createSchedule.actionInProgress ? 'Creating...' : 'Add Schedule'}
            </button>
          </div>
          <p class="text-gray-600">
            You can create as many schedules as you want, but only one can be set as your primary schedule for each year. In most cases, you'll only need one per year. Your primary schedule will be highlighted on your page, while any other schedules—whether from the same year or different years—will still be available to view from your page.
          </p>
          <Show when={action.createSchedule.lastErrorMessage}>
            <div class="text-red-500">
              {action.createSchedule.lastErrorMessage}
            </div>
          </Show>
        </div>
      </div>

      <Show when={local.schedules.length > 0} fallback={
        <div class="bg-white rounded-2xl shadow-xl p-6 text-center">
          <p class="text-gray-500">No schedules yet. Create one to get started!</p>
        </div>
      }>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={local.schedules}>
            {schedule => (
              <SchedulesListItem schedule={schedule}/>
            )}
          </For>
        </div>
      </Show>

    </div>
  );
};


const SchedulesListItem: Component<{
  schedule: {
    id: number;
    title: string;
    year: number;
    visible: boolean;
    primary: boolean;
    slug: string;
  }
}> = (props) => {
  const {setPrimarySchedule, toggleVisibility, action} = useUserSchedules();

  const handleSetPrimary = async () => {
    try {
      await setPrimarySchedule(props.schedule.id);
    } catch (error) {
      console.error("Failed to set schedule as primary:", error);
      // Error is already handled by the action state
    }
  };
  return (

    <div class="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
      <h3 class="text-lg font-bold mb-2">{props.schedule.title}</h3>
      <p class="text-sm">Year: {props.schedule.year}</p>
      <p class="text-sm">Status: {props.schedule.visible ? 'Public' : 'Private'}</p>
      <p class="text-sm">Primary: {props.schedule.primary ? 'Yes' : 'No'}</p>
      <a href={`/schedules/${props.schedule.slug}`} class={'text-sm text-primary'}>/schedules/{props.schedule.slug}</a>
      <div class="flex flex-row gap-2 justify-around items-center mt-4">
        <a href={`/admin/schedules/${props.schedule.id}/edit`}
           class="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-all"
           title="Edit">
          <FaRegularPenToSquare />
        </a>
        <SchedulePrimaryButton schedule={props.schedule}/>
        <ScheduleVisibilityButton schedule={props.schedule}/>
        <ScheduleDeleteButton schedule={props.schedule}/>
      </div>
    </div>
  )
}


const SchedulePrimaryButton: Component<{
  schedule: {
    id: number;
    title: string;
    year: number;
    visible: boolean;
    primary: boolean;
  }
}> = (props) => {

  const {setPrimarySchedule, action} = useUserSchedules();

  const handleSetPrimary = async () => {
    try {
      await setPrimarySchedule(props.schedule.id);
    } catch (error) {
      console.error("Failed to set schedule as primary:", error);
      // Error is already handled by the action state
    }
  };

  return (
    <button
      onClick={() => handleSetPrimary()}
      disabled={props.schedule.primary || action.setPrimarySchedule.actionInProgress}
      class="bg-accent hover:bg-accent-400 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={props.schedule.primary ? 'Primary' : 'Set Primary'}
    >
      {props.schedule.primary ? <FaSolidStar /> : <FaRegularStar />}
    </button>
  )
}

const ScheduleVisibilityButton: Component<{
  schedule: {
    id: number;
    title: string;
    year: number;
    visible: boolean;
    primary: boolean;
  }
}> = (props) => {

  const {toggleVisibility, action} = useUserSchedules();

  const handleToggleVisibility = async () => {
    try {
      await toggleVisibility(props.schedule.id);
    } catch (error) {
      console.error("Failed to toggle schedule visibility:", error);
      // Error is already handled by the action state
    }
  };

  return (
    <button
      onClick={() => handleToggleVisibility()}
      disabled={action.toggleVisibility.actionInProgress}
      class="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={props.schedule.visible ? 'Make Private' : 'Make Public'}
    >
      {props.schedule.visible ? <FaRegularEye /> : <FaRegularEyeSlash />}
    </button>
  )
}

const ScheduleDeleteButton: Component<{
  schedule: {
    id: number;
    title: string;
    year: number;
    visible: boolean;
    primary: boolean;
    slug: string
  }
}> = (props) => {
  const {deleteSchedule, action} = useUserSchedules();
  const modal = createModalSignal();

  const handleDelete = async () => {
    try {
      await deleteSchedule(props.schedule.id);
      modal.close();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      // Error is already handled by the action state
    }
  };

  return (
    <>
      <button
        onClick={modal.open}
        disabled={action.deleteSchedule.actionInProgress}
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete"
      >
        <FaSolidTrash />
      </button>

      <Dialog open={modal.isOpen()} onOpenChange={modal.setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
          <div class="fixed inset-0 flex items-center justify-center z-50">
            <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <Dialog.Title class="text-xl font-bold mb-4">Delete Schedule</Dialog.Title>
              <Dialog.Description class="text-gray-600 mb-4">
                Are you sure you want to delete "{props.schedule.title}"? This action cannot be undone.
              </Dialog.Description>

              <Show when={action.deleteSchedule.lastErrorMessage}>
                <div class="text-red-500 mb-4">
                  {action.deleteSchedule.lastErrorMessage}
                </div>
              </Show>

              <div class="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={modal.close}
                  disabled={action.deleteSchedule.actionInProgress}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={action.deleteSchedule.actionInProgress}
                >
                  {action.deleteSchedule.actionInProgress ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

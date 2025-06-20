import {type Component, For, Show} from "solid-js";
import {UserSchedulesProvider, useUserSchedules} from "../providers/UserSchedulesProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";

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
  const {local, createSchedule, action} = useUserSchedules();
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

    <div class="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
      <h3 class="text-lg font-bold mb-2">{props.schedule.title}</h3>
      <p class="text-sm">Year: {props.schedule.year}</p>
      <p class="text-sm">Status: {props.schedule.visible ? 'Public' : 'Private'}</p>
      <p class="text-sm mb-4">Primary: {props.schedule.primary ? 'Yes' : 'No'}</p>
      <a>{}</a>
      <div class="flex flex-row gap-2 mt-auto">
        <a href={`/admin/schedules/${props.schedule.id}/edit`}
           class="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-all">Edit</a>
        <SchedulePrimaryButton schedule={props.schedule}/>
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
    >
      {props.schedule.primary ? 'Primary' : 'Set Primary'}
    </button>
  )
}

import {type Component, For, Show} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpc} from "../../../../../lib/orpc/client.ts";
import type {User} from "../../../../../lib/auth/User.ts";
import {Dialog} from "@kobalte/core/dialog";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {
  FaRegularEye,
  FaRegularEyeSlash,
  FaRegularPenToSquare,
  FaRegularStar,
  FaSolidChevronLeft,
  FaSolidStar,
  FaSolidTrash
} from "solid-icons/fa";
import {action} from "@solidjs/router";

interface SchedulesListProps {
  user: User
}

export const SchedulesList: Component<SchedulesListProps> = (props) => {
  return (
    <SchedulesListContent user={props.user}/>
  );
};

const SchedulesListContent: Component<{user: User}> = (props) => {
  const queryClient = useQueryClient();
  const schedules = orpc.private.schedules;

  // Query for user schedules
  const schedulesQuery = useQuery(() =>
    schedules.getSchedules.queryOptions({
      staleTime: 30 * 1000, // 30 seconds
    })
  );

  // Mutation for creating schedules
  const createScheduleMutation = useMutation(() =>
    schedules.create.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  const addSchedule = async () => {
    try {
      await createScheduleMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to create schedule:", error);
      // Error is handled by the mutation state
    }
  };

  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex flex-col gap-4">
          <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Dashboard</p>
          </a>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Your Schedules</h2>
            <button
              class="bg-accent hover:bg-accent-400 text-white px-4 py-2 rounded-lg transition-all"
              onClick={addSchedule}
              disabled={createScheduleMutation.isPending}
            >
              {createScheduleMutation.isPending ? 'Creating...' : 'Add Schedule'}
            </button>
          </div>
          <p class="text-gray-600">
            You can create as many schedules as you want, but only one can be set as your primary schedule for each
            year. In most cases, you'll only need one per year. Your primary schedule will be highlighted on your page,
            while any other schedules—whether from the same year or different years—will still be available to view from
            your page.
          </p>
          <Show when={createScheduleMutation.error}>
            <div class="text-red-500">
              {createScheduleMutation.error?.message || 'Failed to create schedule'}
            </div>
          </Show>
        </div>
      </div>

      <Show when={schedulesQuery.data && schedulesQuery.data.length > 0} fallback={
        <div class="bg-white rounded-2xl shadow-xl p-6 text-center">
          <Show when={schedulesQuery.isLoading}>
            <p class="text-gray-500">Loading schedules...</p>
          </Show>
          <Show when={!schedulesQuery.isLoading}>
            <p class="text-gray-500">No schedules yet. Create one to get started!</p>
          </Show>
        </div>
      }>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={schedulesQuery.data}>
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
  return (

    <div class="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
      <h3 class="text-lg font-bold mb-2">{props.schedule.title}</h3>
      <p class="text-sm">Year: {props.schedule.year}</p>
      <p class="text-sm">Status: {props.schedule.visible ? 'Public' : 'Private'}</p>
      <p class="text-sm">Primary: {props.schedule.primary ? 'Yes' : 'No'}</p>
      <a href={`/schedules/${props.schedule.slug}`} class={'text-sm text-primary'}>/schedules/{props.schedule.slug}</a>
      <div class="flex flex-row gap-2 justify-around items-center mt-4">
        <a href={`/dashboard/schedules/${props.schedule.id}/edit`}
           class="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-all"
           title="Edit">
          <FaRegularPenToSquare/>
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
  const queryClient = useQueryClient();
  const schedules = orpc.private.schedules;

  const setPrimaryMutation = useMutation(() =>
    schedules.setPrimary.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  const handleSetPrimary = async () => {
    try {
      await setPrimaryMutation.mutateAsync({
        scheduleId: props.schedule.id
      });
    } catch (error) {
      console.error("Failed to set schedule as primary:", error);
    }
  };

  return (
    <button
      onClick={() => handleSetPrimary()}
      disabled={props.schedule.primary || setPrimaryMutation.isPending}
      class="bg-accent hover:bg-accent-400 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={props.schedule.primary ? 'Primary' : 'Set Primary'}
    >
      {props.schedule.primary ? <FaSolidStar/> : <FaRegularStar/>}
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
  const queryClient = useQueryClient();
  const schedules = orpc.private.schedules;

  const toggleVisibilityMutation = useMutation(() =>
    schedules.toggleVisibility.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  const handleToggleVisibility = async () => {
    try {
      await toggleVisibilityMutation.mutateAsync({
        scheduleId: props.schedule.id
      });
    } catch (error) {
      console.error("Failed to toggle schedule visibility:", error);
    }
  };

  return (
    <button
      onClick={() => handleToggleVisibility()}
      disabled={toggleVisibilityMutation.isPending}
      class="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={props.schedule.visible ? 'Make Private' : 'Make Public'}
    >
      {props.schedule.visible ? <FaRegularEye/> : <FaRegularEyeSlash/>}
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
  const queryClient = useQueryClient();
  const schedules = orpc.private.schedules;
  const modal = createModalSignal();

  const deleteScheduleMutation = useMutation(() =>
    schedules.delete.mutationOptions({
      onSuccess: async () => {
        // Invalidate schedules query to refresh the list
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  const handleDelete = async () => {
    try {
      await deleteScheduleMutation.mutateAsync(props.schedule.id);
      modal.close();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  return (
    <>
      <button
        onClick={modal.open}
        disabled={deleteScheduleMutation.isPending}
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete"
      >
        <FaSolidTrash/>
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

              <Show when={deleteScheduleMutation.error}>
                <div class="text-red-500 mb-4">
                  {deleteScheduleMutation.error?.message || 'Failed to delete schedule'}
                </div>
              </Show>

              <div class="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={modal.close}
                  disabled={deleteScheduleMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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

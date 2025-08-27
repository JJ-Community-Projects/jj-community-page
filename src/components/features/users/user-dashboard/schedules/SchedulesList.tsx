import {type Component, createSignal, For, Show} from "solid-js";
import {QueryClientProvider, useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import type {User} from "../../../../../lib/auth/User.ts";
import {Dialog} from "@kobalte/core/dialog";
import {createModalSignal} from "../../../../../lib/createModalSignal.ts";
import {CreateScheduleDialog} from "./CreateScheduleDialog.tsx";
import {ScheduleHeader} from "./ScheduleHeader.tsx";
import {
  FaRegularEye,
  FaRegularEyeSlash,
  FaRegularPenToSquare,
  FaRegularStar,
  FaSolidStar,
  FaSolidTrash
} from "solid-icons/fa";
import {QueryClient} from "@tanstack/query-core";

interface SchedulesListProps {
  user: User
}

export const SchedulesList: Component<SchedulesListProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SchedulesListContent user={props.user}/>
    </QueryClientProvider>
  );
};

const SchedulesListContent: Component<{ user: User }> = (props) => {
  const queryClient = useQueryClient();
  const schedules = orpcPrivate.schedules;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = createSignal(false);

  // Query for user schedules
  const schedulesQuery = useQuery(() =>
    schedules.getSchedules.queryOptions({
      staleTime: 30 * 1000, // 30 seconds
    })
  );

  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <ScheduleHeader onAddSchedule={() => setIsCreateDialogOpen(true)} />

      <Show when={schedulesQuery.data && schedulesQuery.data.length > 0} fallback={
        <div class="bg-white rounded-xl p-8 shadow-md border-2 border-accent-100 text-center">
          <Show when={schedulesQuery.isLoading}>
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p class="text-gray-600 font-medium">Loading your schedules...</p>
            </div>
          </Show>
          <Show when={!schedulesQuery.isLoading}>
            <div class="flex flex-col items-center gap-6">
              <div class="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="space-y-2">
                <h3 class="~text-lg/xl font-bold text-gray-800">No Schedules Yet</h3>
                <p class="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Create your first schedule to start organizing your streams and events.
                  You can have multiple schedules, but only one primary schedule per year.
                </p>
              </div>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                class="
                  px-6 py-3 bg-accent text-white rounded-lg font-medium
                  hover:bg-accent-600 shadow-sm hover:shadow-md
                  focus:ring-2 focus:ring-accent focus:ring-offset-2
                  transition-all duration-200 transform active:scale-95
                "
              >
                Create Your First Schedule
              </button>
            </div>
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

      <CreateScheduleDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        onSuccess={async () => {
          // Invalidate schedules query to refresh the list
          await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
        }}
      />

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
    <div class="bg-white rounded-xl p-6 shadow-md border-2 border-primary-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300 group">
      {/* Status badges */}
      <div class="flex items-center gap-2 mb-3">
        <Show when={props.schedule.primary}>
          <span class="px-2 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">
            Primary {props.schedule.year}
          </span>
        </Show>
        <span class={`px-2 py-1 text-xs font-medium rounded-full ${
          props.schedule.visible 
            ? 'bg-success-100 text-success-700' 
            : 'bg-neutral-200 text-neutral-700'
        }`}>
          {props.schedule.visible ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Schedule title */}
      <h3 class="~text-lg/xl font-bold text-gray-800 mb-3 group-hover:text-primary-600 transition-colors">
        {props.schedule.title}
      </h3>

      {/* Schedule details */}
      <div class="space-y-1 mb-4">
        <p class="text-sm text-gray-600">
          <span class="font-medium">Year:</span> {props.schedule.year}
        </p>
        <a
          href={`/schedules/${props.schedule.slug}`}
          class="text-sm text-primary hover:text-primary-600 hover:underline font-medium transition-colors block"
          target="_blank"
          rel="noopener noreferrer"
        >
          /schedules/{props.schedule.slug} ↗
        </a>
      </div>

      {/* Action buttons */}
      <div class="flex flex-row gap-2 justify-center items-center mt-4">
        <a
          href={`/dashboard/schedules/${props.schedule.id}/edit`}
          class="
            p-2 bg-accent text-white rounded-lg transition-all duration-200
            hover:bg-accent-600 shadow-sm hover:shadow-md
            focus:ring-2 focus:ring-accent focus:ring-offset-2
            transform active:scale-95
          "
          title="Edit Schedule"
        >
          <FaRegularPenToSquare class="w-4 h-4" />
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
  const schedules = orpcPrivate.schedules;

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
      class="
        p-2 bg-accent text-white rounded-lg font-medium
        hover:bg-accent-600 shadow-sm hover:shadow-md
        focus:ring-2 focus:ring-accent focus:ring-offset-2
        transition-all duration-200 transform active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      title={props.schedule.primary ? 'Primary Schedule' : 'Set as Primary'}
    >
      {props.schedule.primary ? <FaSolidStar class="w-4 h-4" /> : <FaRegularStar class="w-4 h-4" />}
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
  const schedules = orpcPrivate.schedules;

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
      class="
        p-2 bg-primary text-white rounded-lg font-medium
        hover:bg-primary-600 shadow-sm hover:shadow-md
        focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-all duration-200 transform active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      title={props.schedule.visible ? 'Make Private' : 'Make Public'}
    >
      {props.schedule.visible ? <FaRegularEye class="w-4 h-4" /> : <FaRegularEyeSlash class="w-4 h-4" />}
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
  const schedules = orpcPrivate.schedules;
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
        class="
          p-2 bg-danger text-white rounded-lg font-medium
          hover:bg-danger-600 shadow-sm hover:shadow-md
          focus:ring-2 focus:ring-danger focus:ring-offset-2
          transition-all duration-200 transform active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        title="Delete Schedule"
      >
        <FaSolidTrash class="w-4 h-4" />
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

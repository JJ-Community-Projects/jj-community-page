import { Show, For } from "solid-js";
import { FaSolidUsers } from "solid-icons/fa";

export function TeamsGridSkeleton(props: { when?: boolean }) {
  return (
    <Show when={props.when}>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For each={Array(6).fill(0)}>
          {() => (
            <div class="bg-white rounded-xl px-4 py-3 shadow-md border-2 border-gray-100">
              <div class="animate-pulse space-y-3">
                <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                <div class="space-y-2">
                  <div class="h-4 bg-gray-200 rounded"></div>
                  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div class="flex justify-between items-center pt-2">
                  <div class="h-6 bg-gray-200 rounded-full w-20"></div>
                  <div class="h-4 w-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}

export function TeamsEmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
        <FaSolidUsers class="w-8 h-8 text-white" />
      </div>
      <h3 class="~text-lg/xl font-semibold text-neutral-700 mb-2 font-poppins">No teams found</h3>
      <p class="text-neutral-500 ~text-sm/base font-poppins">Teams will appear here when they become available.</p>
    </div>
  );
}

import {type Component, createEffect, createSignal, Show} from "solid-js";
import {useScheduleEditor2} from "./ScheduleEditorProvider.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";

// Simple status icons (mirroring old editor look)
import {FaRegularCircle, FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";

const Correct: Component = () => <FaRegularCircleCheck class={"text-green-500"} size={20} />;
const Wrong: Component = () => <FaRegularCircleXmark class={"text-red-500"} size={20} />;
const LoadingIcon: Component = () => <FaRegularCircle class={"text-blue-500"} size={20} />;

export const ScheduleEditorSettings: Component = () => {
  const { state, updateMeta, updateMetaMutation } = useScheduleEditor2();

  // Local slug state to support validation while typing
  const [slug, setSlug] = createSignal("");

  // Sync local slug with schedule when schedule changes
  createEffect(() => {
    if (state.schedule) setSlug(state.schedule.slug);
  });

  // Slug validation query (enabled only when slug differs and not empty)
  const validateSlug = useQuery(() =>
    orpcPrivate.schedules.validateSlug.queryOptions({
      input: {
        id: state.schedule?.id ?? 0,
        slug: slug(),
        title: state.schedule?.title ?? "",
      },
      enabled: () => Boolean(state.schedule) && slug() !== state.schedule!.slug && slug().length > 0,
    })
  );

  // Debounced field updaters
  const updateTitleDebounced = debounce((value: string) => {
    if (!state.schedule) return;
    const title = value?.trim();
    if (!title) return; // keep schema min(1)
    void updateMeta({ scheduleId: state.schedule.id, title });
  }, 250);

  const updateYearDebounced = debounce((value: string) => {
    if (!state.schedule) return;
    const n = parseInt(value, 10);
    if (Number.isFinite(n)) {
      void updateMeta({ scheduleId: state.schedule.id, year: n });
    }
  }, 250);

  const updateVisibleDebounced = debounce((checked: boolean) => {
    if (!state.schedule) return;
    void updateMeta({ scheduleId: state.schedule.id, visible: checked });
  }, 200);

  const setSlugDebounced = debounce((v: string) => {
    setSlug(v);
  }, 500);

  const applySlug = (nextSlug: string) => {
    if (!state.schedule) return;
    void updateMeta({ scheduleId: state.schedule.id, slug: nextSlug });
  };

  const slugValidationState = () => {
    if (validateSlug.data) {
      return validateSlug.data.isValid ? "valid" : "invalid";
    }
    return "valid";
  };

  const slugErrorMessage = () => {
    if (validateSlug.isError) return validateSlug.error?.message;
    if (validateSlug.isSuccess && !validateSlug.data?.isValid) {
      return "This slug is not available. Try one of these suggestions:";
    }
    return undefined;
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-xl font-bold mb-4">Schedule Settings</h2>

      <Show when={!state.schedule}>
        <div class="text-sm text-gray-600">Loading schedule...</div>
      </Show>

      <Show when={state.schedule}>
        {(s) => (
          <div class="grid grid-cols-1 gap-4">
            {/* Error from updateMeta */}
            <Show when={updateMetaMutation.isError}>
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {updateMetaMutation.error?.message}
              </div>
            </Show>

            {/* Title + Year */}
            <div class="flex gap-4">
              <TextField
                name="title"
                class="flex flex-col flex-grow"
                value={s().title}
                onChange={updateTitleDebounced}
                disabled={updateMetaMutation.isPending}
              >
                <TextField.Label class="text-sm font-medium mb-1">Title:</TextField.Label>
                <div class="relative">
                  <TextField.Input class="border border-gray-300 rounded-lg px-3 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed" />
                  <Show when={updateMetaMutation.isPending}>
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                    </div>
                  </Show>
                </div>
              </TextField>

              <TextField
                name="year"
                class="flex flex-col w-1/3"
                value={String(s().year)}
                onChange={updateYearDebounced}
                disabled={updateMetaMutation.isPending}
              >
                <TextField.Label class="text-sm font-medium mb-1">Year:</TextField.Label>
                <TextField.Input type="number" class="border border-gray-300 rounded-lg px-3 py-2" />
              </TextField>
            </div>

            {/* Slug */}
            <TextField
              name="slug"
              class="flex flex-col"
              value={slug()}
              onChange={setSlugDebounced}
              validationState={slugValidationState()}
              disabled={updateMetaMutation.isPending}
            >
              <TextField.Label class="text-sm font-medium mb-1">Slug:</TextField.Label>
              <div class="w-full flex flex-row items-center gap-4">
                <TextField.Input class="w-full border border-gray-300 rounded-lg px-3 py-2" />
                <div>
                  <Show when={validateSlug.isPending}>
                    <LoadingIcon />
                  </Show>
                  <Show when={validateSlug.isSuccess && validateSlug.data?.isValid && slug() !== ""}>
                    <Correct />
                  </Show>
                  <Show when={validateSlug.isSuccess && !validateSlug.data?.isValid && slug() !== ""}>
                    <Wrong />
                  </Show>
                </div>
              </div>
              <TextField.Description class="text-xs text-gray-500 mt-1">
                This will be used in the URL: /schedules/{slug()}
              </TextField.Description>
              <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                {slugErrorMessage()}
              </TextField.ErrorMessage>

              <Show when={(validateSlug.data?.suggestions.length ?? 0) > 0}>
                <div class="mt-2">
                  <ul class="flex flex-wrap gap-2">
                    {validateSlug.data?.suggestions.map((suggestion: string) => (
                      <li>
                        <button
                          type="button"
                          class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                          onClick={() => applySlug(suggestion)}
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </Show>
            </TextField>

            {/* Visible */}
            <Checkbox
              name="visible"
              class="items-center inline-flex cursor-pointer"
              checked={s().visible}
              onChange={updateVisibleDebounced}
              disabled={updateMetaMutation.isPending}
            >
              <Checkbox.Input class="sr-only" />
              <Checkbox.Control class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
                <Checkbox.Indicator>
                  <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
                    <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2" />
                  </svg>
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="ml-2 text-sm font-medium">Schedule Visible</Checkbox.Label>
              <Checkbox.Description class="text-xs text-gray-500 ml-2">
                When checked, this schedule will be publicly visible.
              </Checkbox.Description>
            </Checkbox>
          </div>
        )}
      </Show>
    </div>
  );
};

export default ScheduleEditorSettings;

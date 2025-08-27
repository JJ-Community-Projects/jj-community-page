import {type Component, createSignal, For, Show} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {Dialog} from "@kobalte/core/dialog";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {useMutation, useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {DateTime} from "luxon";

export const CreateScheduleDialog: Component<{
  isOpen: () => boolean,
  setIsOpen: (open: boolean) => void,
  onSuccess?: () => Promise<void> | void
}> = (props) => {
  // Form state signals
  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [debounceSlug, setDebounceSlug] = createSignal<string>('')

  const [primary, setPrimary] = createSignal(false);
  const [year, setYear] = createSignal(DateTime.now().year);

  // Slug validation query - we'll need a scheduleId for this, so we'll use 0 for new schedules
  const validateSlug = useQuery(() => orpcPrivate.schedules.validateSlug.queryOptions({
    input: {
      slug: debounceSlug(),
      title: name()
    },
    enabled: () => debounceSlug().length > 0,
  }));

  // oRPC mutations
  const createScheduleMutation = useMutation(() =>
    orpcPrivate.schedules.createWithDetails.mutationOptions({
      onSuccess: async () => {
        props.setIsOpen(false);
        // Reset form
        setName("");
        setSlug("");
        setPrimary(false);
        setYear(DateTime.now().year);
        // Call the onSuccess callback if provided
        if (props.onSuccess) {
          await props.onSuccess();
        }
      }
    })
  );

  // Validation helper functions
  const isCheckingSlug = () => {
    return validateSlug.isPending;
  };

  const slugValid = () => {
    if (!validateSlug.data) {
      return false;
    }
    return validateSlug.data.isValid;
  };

  const slugErrorMessage = () => {
    return validateSlug.error?.message;
  };

  const suggestions = () => {
    if (!validateSlug.data) {
      return [];
    }
    return validateSlug.data.suggestions;
  };

  // Create debounced function for slug setting
  const setSlugDebounce = debounce((slugValue: string) => {
    const sanitizedSlug = slugValue.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setDebounceSlug(sanitizedSlug);
  }, 500);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]/g, "-");
    setSlug(generatedSlug);
    setDebounceSlug(generatedSlug);
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugDebounce(value);
  };

  const handleYearChange = (value: string) => {
    const yearValue = parseInt(value);
    if (!isNaN(yearValue)) {
      setYear(yearValue);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name() || !slug() || !slugValid()) {
      return;
    }

    try {
      await createScheduleMutation.mutateAsync({
        name: name(),
        slug: slug(),
        primary: primary(),
        year: year()
      });
    } catch (error) {
      console.error("Failed to create schedule:", error);
      // Error is already handled by the mutation state
    }
  };

  return (
    <Dialog open={props.isOpen()} onOpenChange={props.setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <Dialog.Title class="text-xl font-bold mb-4">Create New Schedule</Dialog.Title>
            <Dialog.Description class="text-gray-600 mb-4">
              Create a new schedule to organize your streams and events.
            </Dialog.Description>

            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              <TextField value={name()} onChange={handleNameChange}>
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </TextField.Label>
                <TextField.Input
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="My Awesome Schedule 2024"
                />
              </TextField>

              <TextField
                value={slug()}
                onChange={handleSlugChange}
                validationState={slugValid() ? "valid" : "invalid"}
              >
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Slug
                </TextField.Label>
                <div class="relative">
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="my-awesome-schedule-2024"
                  />
                  <Show when={isCheckingSlug()}>
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                    </div>
                  </Show>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {slugErrorMessage() || (!slugValid() ? "This slug is not available. Try one of these suggestions:" : undefined)}
                </TextField.ErrorMessage>

                <Show when={suggestions().length > 0}>
                  <div class="mt-2">
                    <ul class="flex flex-wrap gap-2">
                      <For each={suggestions()}>
                        {(suggestion) => (
                          <li>
                            <button
                              type="button"
                              class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                              onClick={() => {
                                setSlug(suggestion);
                              }}
                            >
                              {suggestion}
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>

                <p class="text-xs text-gray-500 mt-1">
                  This will be used in URLs: jj.ostof.dev/schedules/{slug() || "your-schedule-slug"}
                </p>
              </TextField>

              <TextField value={year().toString()} onChange={handleYearChange}>
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </TextField.Label>
                <TextField.Input
                  type="number"
                  min="2020"
                  max="2030"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="2024"
                />
              </TextField>

              <Checkbox checked={primary()} onChange={setPrimary}>
                <div class="flex items-center gap-2">
                  <Checkbox.Input class="sr-only" />
                  <Checkbox.Control class="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center data-[checked]:bg-accent data-[checked]:border-accent">
                    <Checkbox.Indicator>
                      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </Checkbox.Indicator>
                  </Checkbox.Control>
                  <Checkbox.Label class="text-sm font-medium text-gray-700">
                    Set as primary schedule for {year()}
                  </Checkbox.Label>
                </div>
              </Checkbox>

              <Show when={createScheduleMutation.isError}>
                <div class="text-red-500 text-sm mt-2">
                  {createScheduleMutation.failureReason?.message}
                </div>
              </Show>

              <div class="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => props.setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!name() || !slug() || !slugValid() || createScheduleMutation.isPending}
                >
                  {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

import {type Component, createSignal, For, Show} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {Dialog} from "@kobalte/core/dialog";
import {TextField} from "@kobalte/core/text-field";
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";
import {createSlug} from "../../../../../../lib/createSlug.ts";

export const CreateTeamDialog: Component<{ isOpen: () => boolean, setIsOpen: (open: boolean) => void }> = (props) => {
  // Form state signals
  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  // The slug as the server stores it (F-59): what gets checked, created and shown in the URL
  const normalizedSlug = () => createSlug(slug());
  // What the server checks: slug and name 500 ms after the last keystroke in either field
  const [checked, setChecked] = createSignal({slug: "", name: ""});
  const client = useQueryClient()

  // Slug validation query
  const validateSlug = useQuery(() => orpcPrivate.teams.validateSlug.queryOptions({
    input: {
      slug: checked().slug,
      tiltifyName: checked().name
    },
    enabled: () => checked().slug.length > 0,
    staleTime: 30 * 1000,
  }));

  // oRPC mutations
  const createTeamMutation = useMutation(() =>
    orpcPrivate.teams.create.mutationOptions({
      onSuccess: async () => {
        props.setIsOpen(false);
        // Reset form
        setName("");
        setSlug("");
        setCheckedNow("");
        await client.invalidateQueries({
          queryKey:orpcPrivate.teams.canCreateTeam.queryKey(),
        })
        await client.invalidateQueries({
          queryKey:orpcPrivate.teams.canInviteCurrentUser.queryKey(),
        })
      }
    })
  );

  // Validation helper functions
  const isCheckingSlug = () => {
    return validateSlug.isPending || checked().slug !== normalizedSlug();
  };

  const slugValid = () => {
    if (!validateSlug.data || checked().slug !== normalizedSlug()) {
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

  // Create debounced function for the checked slug and name
  const setCheckedDebounce = debounce(setChecked, 500);

  const setCheckedNow = (slugValue: string) => {
    setCheckedDebounce.clear();
    setChecked({slug: slugValue, name: name()});
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    const generatedSlug = createSlug(value);
    setSlug(generatedSlug);
    setCheckedDebounce({slug: generatedSlug, name: value});
  };

  const handleSlugChange = (value: string) => {
    // Typing keeps hyphens where they are; the check and the URL use the normalised slug
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlug(sanitizedSlug);
    setCheckedDebounce({slug: createSlug(sanitizedSlug), name: name()});
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name() || !slug() || !slugValid()) {
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: name(),
        slug: normalizedSlug()
      });
    } catch (error) {
      console.error("Failed to create team:", error);
      // Error is already handled by the mutation state
    }
  };

  return (
    <Dialog open={props.isOpen()} onOpenChange={props.setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <Dialog.Title class="text-xl font-bold mb-4">Create New Team</Dialog.Title>
            <Dialog.Description class="text-gray-600 mb-4">
              Create a new team to collaborate with others on JingleJam schedules.
            </Dialog.Description>

            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              <TextField value={name()} onChange={handleNameChange}>
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </TextField.Label>
                <TextField.Input
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="My Awesome Team"
                />
              </TextField>

              <TextField
                value={slug()}
                onChange={handleSlugChange}
                validationState={slugValid() ? "valid" : "invalid"}
              >
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Slug
                </TextField.Label>
                <div class="relative">
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="my-awesome-team"
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
                                setCheckedNow(suggestion);
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
                  This will be used in URLs: jinglejam.ostof.dev/teams/{normalizedSlug() || "your-team-slug"}
                </p>
              </TextField>

              <Show when={createTeamMutation.isError}>
                <div class="text-red-500 text-sm mt-2">
                  {createTeamMutation.failureReason?.message}
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
                  disabled={!name() || !slug() || !slugValid() || createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

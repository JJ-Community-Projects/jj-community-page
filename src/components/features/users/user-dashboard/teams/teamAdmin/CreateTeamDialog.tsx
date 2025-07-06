import {type Component, For, Show} from "solid-js";
import {useUser} from "../../providers/UserProvider.tsx";
import {createStore} from "solid-js/store";
import {debounce} from "@solid-primitives/scheduled";
import {Dialog} from "@kobalte/core/dialog";
import {TextField} from "@kobalte/core/text-field";

export const CreateTeamDialog: Component<{ isOpen: () => boolean, setIsOpen: (open: boolean) => void }> = (props) => {
  const {createTeam, isTeamSlugUnique, action} = useUser();
  const [formState, setFormState] = createStore({
    name: "",
    slug: "",
    isSlugValid: true,
    suggestions: [] as string[]
  });

  // Create debounced function for slug validation
  const checkSlugUnique = debounce(async (slug: string) => {
    if (!slug) {
      setFormState("isSlugValid", false);
      setFormState("suggestions", []);
      return;
    }

    try {
      const {data, error} = await isTeamSlugUnique(slug, formState.name);
      if (error) {
        console.error("Error checking slug:", error);
        setFormState("isSlugValid", false);
        setFormState("suggestions", []);
        return;
      }

      setFormState("isSlugValid", data.isValid);
      setFormState("suggestions", data.suggestions || []);
    } catch (error) {
      console.error("Error checking slug:", error);
      setFormState("isSlugValid", false);
      setFormState("suggestions", []);
    }
  }, 500);

  const handleNameChange = (value: string) => {
    setFormState("name", value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]/g, "-");
    setFormState("slug", generatedSlug);
    checkSlugUnique(generatedSlug);
  };

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setFormState("slug", sanitizedSlug);
    checkSlugUnique(sanitizedSlug);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formState.name || !formState.slug || !formState.isSlugValid) {
      return;
    }

    try {
      await createTeam(formState.name, formState.slug);
      props.setIsOpen(false);
      setFormState({
        name: "",
        slug: "",
        isSlugValid: true,
        suggestions: []
      });
    } catch (error) {
      console.error("Failed to create team:", error);
      // Error is already handled by the action state
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
              <TextField value={formState.name} onChange={handleNameChange}>
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </TextField.Label>
                <TextField.Input
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="My Awesome Team"
                />
              </TextField>

              <TextField
                value={formState.slug}
                onChange={handleSlugChange}
                validationState={formState.isSlugValid ? "valid" : "invalid"}
              >
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Slug
                </TextField.Label>
                <div class="relative">
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="my-awesome-team"
                  />
                  <Show when={action.isTeamSlugUnique.actionInProgress}>
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                    </div>
                  </Show>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {!formState.isSlugValid ? "This slug is not available. Try one of these suggestions:" : action.isTeamSlugUnique.lastErrorMessage}
                </TextField.ErrorMessage>

                <Show when={formState.suggestions.length > 0}>
                  <div class="mt-2">
                    <ul class="flex flex-wrap gap-2">
                      <For each={formState.suggestions}>
                        {(suggestion) => (
                          <li>
                            <button
                              type="button"
                              class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                              onClick={() => {
                                setFormState("slug", suggestion);
                                checkSlugUnique(suggestion);
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
                  This will be used in URLs: jj.ostof.dev/teams/{formState.slug || "your-team-slug"}
                </p>
              </TextField>

              <Show when={action.createTeam.lastErrorMessage}>
                <div class="text-red-500 text-sm mt-2">
                  {action.createTeam.lastErrorMessage}
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
                  disabled={!formState.name || !formState.slug || !formState.isSlugValid || action.createTeam.actionInProgress}
                >
                  {action.createTeam.actionInProgress ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

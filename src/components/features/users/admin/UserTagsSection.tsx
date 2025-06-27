import {
  type Component,
  createSignal,
  For,
  Switch,
  Match,
  createResource,
  type Signal
} from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { Dialog } from "@kobalte/core/dialog";
import { createModalSignal } from "../../../../lib/createModalSignal.ts";
import { useUser } from "./providers/UserProvider.tsx";
import { debounce } from "@solid-primitives/scheduled";
import { FaRegularCircle } from "solid-icons/fa";
import { createStore, reconcile, unwrap } from "solid-js/store";


function createDeepSignal<T>(value: T): Signal<T> {
  const [store, setStore] = createStore({
    value,
  })
  return [
    () => store.value,
    (v: T) => {
      const unwrapped = unwrap(store.value)
      typeof v === "function" && (v = v(unwrapped))
      setStore("value", reconcile(v))
      return store.value
    },
  ] as Signal<T>
}

export const UserTagsSection: Component = () => {
  // Get user context
  const {
    local,
    user,
    addTag,
    removeTag,
    getPopularTags,
    getSuggestedTagsForUser,
    getSuggestedTagsForUserBySearchTerm,
    action
  } = useUser();

  // State for tag input and dialog
  const [tagInput, setTagInput] = createSignal("");
  const [tagLabel, setTagLabel] = createSignal("");
  const modal = createModalSignal();

  // State for tag search and suggestions
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [refetchTrigger, setRefetchTrigger] = createSignal(0);

  // Source signal for createResource - combines debounced input and refetch trigger
  const tagSource = () => ({
    input: debouncedInput(),
    trigger: refetchTrigger(),
    userId: user.id
  });

  // Debounced input handler
  const debouncedSetSearchInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 1000);

  // Fetch tags function for createResource
  const fetchTags = async (source: { input: string, trigger: number, userId: number }) => {
    console.log('fetchTags', source);
    if (source.input && source.input.length > 0) {
      return getSuggestedTagsForUserBySearchTerm(source.userId, source.input);
    } else {
      return getSuggestedTagsForUser(source.userId);
    }
  };

  // Create resource for fetching tags
  const [data, { refetch }] = createResource(tagSource, fetchTags, {
    storage: createDeepSignal
  });

  // Helper functions for UI - use data.latest to prevent UI flickering during loading
  const suggestedTags = () => {
    return (data.latest?.tags || []);
  };

  const defaultTags = () => {
    return (data.latest?.defaultTags || []);
  };

  const charityTags = () => {
    return (data.latest?.charityTags || []);
  };

  const isLoadingTags = () => data.loading ||
    action.getSuggestedTagsForUser.actionInProgress ||
    action.getSuggestedTagsForUserBySearchTerm.actionInProgress;

  const hasTags = () => (suggestedTags().length > 0 || defaultTags().length > 0 || charityTags().length > 0);
  const hasTagsError = () => !!action.getSuggestedTagsForUser.lastErrorMessage ||
    !!action.getSuggestedTagsForUserBySearchTerm.lastErrorMessage;

  // Handle adding a new tag
  const handleAddTag = async () => {
    const tag = tagInput().trim();
    const label = tagLabel().trim() || tag;

    if (!tag) return;

    try {
      await addTag(tag, label);
      setTagInput("");
      setTagLabel("");
      modal.close();
      // Trigger refetch after adding a tag
      setRefetchTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  // Handle removing a tag
  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTag(tag);
      // Trigger refetch after removing a tag
      setRefetchTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  // Handle selecting a suggested tag
  const handleSelectTag = async (event: Event, tag: string, label?: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!local.userTags.some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      try {
        await addTag(tag, label || tag);
        setSearchInput("");
        setDebouncedInput("");
        // Trigger refetch after selecting a tag
        setRefetchTrigger(prev => prev + 1);
      } catch (error) {
        console.error("Error adding tag:", error);
      }
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">User Tags</h3>
        <button
          type="button"
          onClick={modal.open}
          class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-all"
        >
          Add New Tag
        </button>
      </div>

      {/* Explanation text */}
      <div class="mb-4 text-sm text-gray-600">
        <p>Tags help others discover streamers with similar interests and causes. Add regular tags to show off your favorite games, hobbies, or communities — and don't forget to add a charity tag to highlight the cause you're fundraising for.</p>
        <p class="mt-2">This makes it easier for viewers to connect with you and support the charity you care about most.</p>
        <p class="mt-2">You can pick from suggested tags, search for existing ones, or create your own custom tags — it's quick and easy! The more relevant your tags, the easier it is for viewers to connect with you and support your stream.</p>
      </div>

      {/* Tag Search Input */}
      <div class="mb-4">
        <TextField
          name="searchInput"
          value={searchInput()}
          onChange={(value) => {
            setSearchInput(value);
            debouncedSetSearchInput(value);
          }}
        >
          <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Search Tags</TextField.Label>
          <TextField.Input
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search for tags..."
          />
          <TextField.Description class="mt-1 text-sm text-gray-500">
            Search for tags to add to your profile.
          </TextField.Description>
        </TextField>
      </div>

      {/* Suggested Tags */}
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <p class="text-sm font-medium text-gray-700">Suggested Tags:</p>

          {/* State indicator for fetch process */}
          <div class="flex items-center gap-1">
            <Switch>
              <Match when={data.loading}>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  <FaRegularCircle class="inline mr-1 text-blue-500 animate-ping" size={8}/>
                  Loading
                </span>
              </Match>
              <Match when={data.error}>
                <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Error
                </span>
              </Match>
              <Match when={data.state === 'ready'}>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </Match>
            </Switch>
          </div>
        </div>

        {/* Use Switch/Match to show the state of the fetch process */}
        <Switch fallback={
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            <p class="text-xs text-gray-500">No suggested tags available.</p>
          </div>
        }>
          {/* Error state */}
          <Match when={data.error}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-red-500 mb-1">Error loading tags: {hasTagsError() ?
                (action.getSuggestedTagsForUser.lastErrorMessage || action.getSuggestedTagsForUserBySearchTerm.lastErrorMessage) :
                "Unknown error"}</p>
            </div>
          </Match>

          {/* Loading state */}
          <Match when={data.loading && !data.latest}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-gray-500">Loading tags...</p>
            </div>
          </Match>

          {/* Data state */}
          <Match when={data.latest && hasTags()}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              {/* Suggested tags */}
              <For each={suggestedTags()}>
                {(tag) => (
                  <button
                    type="button"
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                    class="text-white text-xs bg-accent-200 hover:bg-accent-300 px-2 py-1 rounded-full transition-all"
                  >
                    {tag.label} ({tag.count})
                  </button>
                )}
              </For>

              {/* Default tags */}
              <For each={defaultTags()}>
                {(tag) => (
                  <button
                    type="button"
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                    class="text-white text-xs bg-accent-200 hover:bg-accent-300 px-2 py-1 rounded-full transition-all"
                  >
                    {tag.label} ({tag.count})
                  </button>
                )}
              </For>

              {/* Charity tags */}
              <For each={charityTags()}>
                {(tag) => (
                  <button
                    type="button"
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                    class="text-xs bg-primary-200 hover:bg-primary-300 text-white px-2 py-1 rounded-full transition-all"
                  >
                    {tag.label} ({tag.count})
                  </button>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>

      {/* Current Tags */}
      <div class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Your Tags:</p>
        <Switch>
          <Match when={action.addTag.actionInProgress || action.removeTag.actionInProgress}>
            <div class="flex justify-center items-center p-4">
              <p class="text-gray-500">Loading...</p>
            </div>
          </Match>

          <Match when={action.addTag.lastErrorMessage || action.removeTag.lastErrorMessage}>
            <div class="flex justify-center items-center p-4">
              <p class="text-red-500">Error: {action.addTag.lastErrorMessage || action.removeTag.lastErrorMessage}</p>
            </div>
          </Match>

          <Match when={local.userTags.length === 0}>
            <div class="flex justify-center items-center p-4">
              <p class="text-gray-500">No tags added yet. Click "Add Tag" to add your first tag.</p>
            </div>
          </Match>

          <Match when={local.userTags.length > 0}>
            <div class="flex flex-wrap gap-2">
              <For each={local.userTags}>
                {(tag) => (
                  <div class="flex items-center bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm">
                    {tag.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.tag)}
                      class="ml-2 text-accent hover:text-accent-600"
                      aria-label={`Remove tag ${tag.label}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={modal.isOpen()} onOpenChange={modal.setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
          <div class="fixed inset-0 flex items-center justify-center z-50">
            <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <Dialog.Title class="text-xl font-bold mb-4">Add Tag</Dialog.Title>
              <Dialog.Description class="text-gray-600 mb-4">
                Add a new tag to your profile. Tags can be used to categorize your content and make it easier for others to find.
              </Dialog.Description>

              <div class="space-y-4">
                <TextField value={tagInput()} onChange={setTagInput}>
                  <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Tag</TextField.Label>
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter tag (e.g., streamer, charity)"
                  />
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This will be used as the tag identifier. Spaces will be replaced with hyphens.
                  </TextField.Description>
                </TextField>

                <TextField value={tagLabel()} onChange={setTagLabel}>
                  <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Display Label (optional)</TextField.Label>
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter display label"
                  />
                  <TextField.Description class="mt-1 text-sm text-gray-500">
                    This is how the tag will be displayed. If left empty, the tag will be used.
                  </TextField.Description>
                </TextField>
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={modal.close}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-600"
                  onClick={handleAddTag}
                  disabled={!tagInput().trim()}
                >
                  Add Tag
                </button>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
};

import {type Component, createSignal, For, Match, Switch} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {Dialog} from "@kobalte/core/dialog";
import {Accordion} from "@kobalte/core/accordion";
import {createModalSignal} from "../../../../lib/createModalSignal.ts";
import {debounce} from "@solid-primitives/scheduled";
import {FaRegularCircle} from "solid-icons/fa";
import "./UserTagsSection.css";
import {orpc} from "../../../../lib/orpc/client/client.ts";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";

export const UserTagsSection: Component = () => {
  const queryClient = useQueryClient();
  const t = orpc.private.editProfile.tags;

  // State for tag input and dialog
  const [tagInput, setTagInput] = createSignal("");
  const [tagLabel, setTagLabel] = createSignal("");
  const modal = createModalSignal();

  // State for tag search and suggestions
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");

  // Debounced input handler
  const debouncedSetSearchInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 1000);


  // TanStack Queries
  const suggestionsQuery = useQuery(() =>
    t.find.suggestions.getSuggestedTagsForUser.queryOptions({
      input: {
        limit: 5
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  );

  const searchQuery = useQuery(() => t.find.suggestions.getSuggestedTagsBySearchTerm.queryOptions({
      input: {
        term: debouncedInput(),
        limit: 5
      },
      enabled: () => debouncedInput().length > 0,
      staleTime: 30 * 1000,
    })
  );

  const getUserTagsQuery = useQuery(() => t.getUserTags.queryOptions({
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));

  // TanStack Mutations
  const addTagMutation = useMutation(() => t.add.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: t.getUserTags.key()});
      },
      onError: (error) => {
        console.error('Failed to add tag:', error);
      }
    })
  );

  const removeTagMutation = useMutation(() => t.remove.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: t.getUserTags.key()});
    },
    onError: (error) => {
      console.error('Failed to remove tag:', error);
    }
  }));

  // Computed values
  const combinedData = () => {
    const searchTerm = debouncedInput();
    if (searchTerm.length > 0) {
      return searchQuery.data || {tags: [], defaultTags: [], charityTags: []};
    }
    return suggestionsQuery.data || {tags: [], defaultTags: [], charityTags: []};
  };

  const suggestedTags = () => combinedData().tags || [];
  const defaultTags = () => combinedData().defaultTags || [];
  const charityTags = () => combinedData().charityTags || [];
  const userTags = () => getUserTagsQuery.data || [];

  const isLoadingTags = () => suggestionsQuery.isLoading ||
    searchQuery.isLoading ||
    addTagMutation.isPending ||
    removeTagMutation.isPending;

  const hasTagsError = () => !!suggestionsQuery.error ||
    !!searchQuery.error ||
    !!addTagMutation.error ||
    !!removeTagMutation.error;

  const hasTags = () => (suggestedTags().length > 0 || defaultTags().length > 0 || charityTags().length > 0);

  // Handle adding a new tag
  const handleAddTag = async () => {
    const tag = tagInput().trim();
    const label = tagLabel().trim() || tag;

    if (!tag) return;

    try {
      await addTagMutation.mutateAsync({tag, label});
      setTagInput("");
      setTagLabel("");
      modal.close();
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  // Handle removing a tag
  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTagMutation.mutateAsync({tag});
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  // Handle selecting a suggested tag
  const handleSelectTag = async (event: Event, tag: string, label?: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!userTags().some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      try {
        await addTagMutation.mutateAsync({tag, label: label || tag});
        setSearchInput("");
        setDebouncedInput("");
      } catch (error) {
        console.error("Error adding tag:", error);
      }
    }
  };

  return (
    <div class="bg-white p-6">
      <div class="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={modal.open}
          class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-all"
        >
          Add New Tag
        </button>
      </div>

      {/* Explanation text in accordion */}
      <Accordion class="mb-4" collapsible={true} defaultValue={[]}>
        <Accordion.Item value="explanation" class="border border-gray-200 rounded-lg">
          <Accordion.Header>
            <Accordion.Trigger
              class="flex justify-between items-center w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              <span>About User Tags</span>
              <svg
                class="w-5 h-5 transform transition-transform duration-200 accordion__item-trigger-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="px-4 pt-0 pb-2 text-sm text-gray-600">
            <div class="pt-2">
              <p>Tags help others discover streamers with similar interests and causes. Add regular tags to show off
                your favorite games, hobbies, or communities — and don't forget to add a charity tag to highlight the
                cause you're fundraising for.</p>
              <p class="mt-2">This makes it easier for viewers to connect with you and support the charity you care
                about most.</p>
              <p class="mt-2">You can pick from suggested tags, search for existing ones, or create your own custom tags
                — it's quick and easy! The more relevant your tags, the easier it is for viewers to connect with you and
                support your stream.</p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>

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
              <Match when={isLoadingTags()}>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  <FaRegularCircle class="inline mr-1 text-blue-500 animate-ping" size={8}/>
                  Loading
                </span>
              </Match>
              <Match when={hasTagsError()}>
                <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Error
                </span>
              </Match>
              <Match when={!isLoadingTags() && !hasTagsError()}>
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
          <Match when={hasTagsError()}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-red-500 mb-1">Error loading tags: {
                suggestionsQuery.error?.message ||
                searchQuery.error?.message ||
                "Unknown error"
              }</p>
            </div>
          </Match>

          {/* Loading state */}
          <Match when={isLoadingTags() && !hasTags()}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-gray-500">Loading tags...</p>
            </div>
          </Match>

          {/* Data state */}
          <Match when={hasTags()}>
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
          <Match when={getUserTagsQuery.isLoading || addTagMutation.isPending || removeTagMutation.isPending}>
            <div class="flex justify-center items-center p-4">
              <p class="text-gray-500">Loading...</p>
            </div>
          </Match>

          <Match when={getUserTagsQuery.error || addTagMutation.error || removeTagMutation.error}>
            <div class="flex justify-center items-center p-4">
              <p
                class="text-red-500">Error: {getUserTagsQuery.error?.message || addTagMutation.error?.message || removeTagMutation.error?.message}</p>
            </div>
          </Match>

          <Match when={userTags().length === 0}>
            <div class="flex justify-center items-center p-4">
              <p class="text-gray-500">No tags added yet. Click on a suggested Tag or "Add Tag" to add your first
                tag.</p>
            </div>
          </Match>

          <Match when={userTags().length > 0}>
            <div class="flex flex-wrap gap-2">
              <For each={userTags()}>
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
                Add a new tag to your profile. Tags can be used to categorize your content and make it easier for others
                to find.
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
                  <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Display Label
                    (optional)</TextField.Label>
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

import {type Component, createMemo, createResource, createSignal, For, Match, Show, Switch, type Signal} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {debounce} from "@solid-primitives/scheduled";
import {FaRegularCircle} from "solid-icons/fa";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {createStore, reconcile, unwrap} from "solid-js/store";

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

interface TagsSectionProps {
  streamId: string;
}

export const TagsSection: Component<TagsSectionProps> = (props) => {
  const {
    local,
    addTag,
    removeTag,
    fetchTags: fetchBackendTags,
    action
  } = useScheduleEditor();

  // Get the current stream's tags from the local store
  const tags = createMemo(() => {
    const stream = local.streams.find(s => s.id === props.streamId);
    return stream?.tags || [];
  });

  // State for tag input and suggestions
  const [tagInput, setTagInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [refetchTrigger, setRefetchTrigger] = createSignal(0);

  // Source signal for createResource - combines debounced input and refetch trigger
  const tagSource = () => ({
    input: debouncedInput(),
    trigger: refetchTrigger()
  });

  // Debounced input handler
  const debouncedSetTagInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 1000);

  // Fetch tags function for createResource
  const fetchTags = async (source: { input: string, trigger: number }) => {
    console.log('fetchTags', source);
    return fetchBackendTags({
      searchTag: source.input ? source.input.length > 0 ? source.input : undefined : undefined,
      stream: {
        scheduleId: local.id,
        streamId: parseInt(props.streamId),
      },
      exclude: tags().map((t) => t.tag)
    });
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

  const isLoadingTags = () => data.loading || action.fetchTags.actionInProgress;
  const hasTags = () => (suggestedTags().length > 0 || defaultTags().length > 0 || charityTags().length > 0);
  const hasTagsError = () => !!action.fetchTags.lastErrorMessage;

  // Handle adding a new tag
  const handleAddTag = () => {
    console.log("handleAddTag");
    const tagText = tagInput().trim();
    if (tagText && !tags().some(t => t.tag.toLowerCase() === tagText.toLowerCase())) {
      addTag(props.streamId, tagText);
      setTagInput("");
      setDebouncedInput("");
      // Trigger refetch after adding a tag
      setRefetchTrigger(prev => prev + 1);
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagObj: {label: string, tag: string}) => {
    removeTag(props.streamId, tagObj.tag);
    // Trigger refetch after removing a tag
    setRefetchTrigger(prev => prev + 1);
  };

  // Handle selecting a suggested tag
  const handleSelectTag = (event: Event, tag: string, label?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!tags().some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      addTag(props.streamId, tag);
    }
    setTagInput("");
    setDebouncedInput("");
    // Trigger refetch after selecting a tag
    setRefetchTrigger(prev => prev + 1);
  };

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-medium">Tags:</h3>

      {/* Tag Input */}
      <div class="flex gap-2">
        <TextField
          name="tagInput"
          class="flex-1"
          value={tagInput()}
          onChange={(value) => {
            setTagInput(value);
            debouncedSetTagInput(value);
          }}
        >
          <div class={'flex flex-row gap-2'}>
            <TextField.Input
              class="border border-gray-300 rounded-lg px-3 py-2 w-full"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all"
            >
              Add
            </button>
          </div>
          <TextField.Description class="text-xs text-gray-500 mt-1">
            You can add any tag. Tags are not case sensitive. Pick tags that describe your stream the best.
          </TextField.Description>
        </TextField>
      </div>

      {/* Default Tags */}
      <div class="mt-2">
        <div class="flex items-center gap-2">
          <p class="text-xs text-gray-500 mb-1">Suggested tags:</p>

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
              <p class="text-xs text-red-500 mb-1">Error loading tags: {action.fetchTags.lastErrorMessage || "Unknown error"}</p>
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
      <Show when={tags().length > 0}>
        <div class="mt-2">
          <p class="text-xs text-gray-500 mb-1">Current tags:</p>
          <div class="flex flex-wrap gap-2">
            <For each={tags()}>
              {(tag) => (
                <div class="flex items-center bg-accent/10 text-accent px-2 py-1 rounded-full text-sm">
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    class="ml-1 text-accent hover:text-accent-600"
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
        </div>
      </Show>
    </div>
  );
};

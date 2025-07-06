import {
  type Component,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  Show, type Signal,
  Switch
} from "solid-js";
import type {
  Tag,
  TagSearchResults
} from "../../../../../../../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes";
import {TextField} from "@kobalte/core/text-field";
import {debounce} from "@solid-primitives/scheduled";
import {FaRegularCircle} from "solid-icons/fa";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {createStore, reconcile, unwrap} from "solid-js/store";
import {useStreamEditor} from "./ScheduleEditorStreamEditDialogBodyProvider.tsx";
import {TagPill} from "../../../../../../common/TagPill.tsx";

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

const useTags = () => {
  const {
    local,
    fetchTags,
    action
  } = useScheduleEditor();
  const {stream, removeTag, addTag} = useStreamEditor()
  // State for tag input and suggestions
  const [tagInput, setTagInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [refetchTrigger, setRefetchTrigger] = createSignal(0);

  // Source signal for createResource - combines debounced input and refetch trigger
  const tagSource = () => ({
    input: debouncedInput(),
    trigger: refetchTrigger()
  });

  const currentTags = createMemo(() => {
    // const s = local.streams.find(s => s.id === stream?.id);
    return stream?.tags || [];
  });

  const currentTagsIds = () => currentTags().map((t) => t.tag)

  // Create resource for fetching tags
  const [data] = createResource(tagSource, (source: { input: string, trigger: number }) => {
    console.log('fetchTags', source);
    return fetchTags({
      searchTag: source.input ? source.input.length > 0 ? source.input : undefined : undefined,
      stream: {
        scheduleId: local.id,
        streamId: parseInt(stream.id),
      },
      exclude: currentTags().map((t) => t.tag)
    });
  }, {
    storage: createDeepSignal
  });

  // Helper functions for UI - use data.latest to prevent UI flickering during loading
  const suggestedTags = (): (Tag & { count: number })[] => {
    return (data()?.tags ?? data.latest?.tags ?? [])
      .filter((tag) => !currentTagsIds().includes(tag.tag))
  };

  const defaultTags = () => {
    return (data()?.defaultTags ?? data.latest?.defaultTags ?? [])
      .filter((tag) => !currentTagsIds().includes(tag.tag))
  };

  const charityTags = () => {
    return (data()?.charityTags ?? data.latest?.charityTags ?? [])
      .filter((tag) => !currentTagsIds().includes(tag.tag))
  };

  const debouncedSetTagInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 1000);

  const isLoadingTags = () => data.loading || action.fetchTags.actionInProgress;
  const hasTags = () => data.latest !== undefined || (suggestedTags().length > 0 || defaultTags().length > 0 || charityTags().length > 0);
  const hasTagsError = () => !!action.fetchTags.lastErrorMessage;
  const hasLatest = () => data.latest !== undefined

  const reset = () => {
    setTagInput("");
    setDebouncedInput("");
    // Trigger refetch after adding a tag
    setRefetchTrigger(prev => prev + 1);
  }

  const handleAddTag = () => {
    console.log("handleAddTag");
    const tagText = tagInput().trim();
    if (tagText && !currentTags().some(t => t.tag.toLowerCase() === tagText.toLowerCase())) {
      reset()
      addTag({
        label: tagText, tag: tagText.toLowerCase()
      })
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    removeTag(tag)
    setRefetchTrigger(prev => prev + 1);
  };


  // Handle selecting a suggested tag
  const handleSelectTag = (event: Event, tag: string, label?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentTags().some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      addTag({
        label: label ?? tag, tag
      })
      setTagInput("");
      setDebouncedInput("");
      // Trigger refetch after selecting a tag
      setRefetchTrigger(prev => prev + 1);
    }
  };

  const isReady = () => data.state === "ready"
  const hasError = () => data.error !== undefined && data.error !== null;
  const hasData = () => data() !== undefined && data() !== null;

  return {
    currentTags,
    suggestedTags,
    defaultTags,
    charityTags,
    debouncedSetTagInput,
    tagInput,
    setTagInput,
    isLoadingTags,
    hasTags, hasTagsError,
    reset,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    isReady,
    hasError, hasData, hasLatest
  }
}

interface TagsSectionProps {
  streamId: number;
}

export const TagsSection: Component<TagsSectionProps> = (props) => {
  const {
    action
  } = useScheduleEditor();

  const {
    tagInput,
    setTagInput,
    debouncedSetTagInput,
    currentTags,
    suggestedTags,
    defaultTags,
    charityTags,
    isLoadingTags,
    handleAddTag,
    isReady,
    hasError,
    hasTags, hasData,
    handleSelectTag, handleRemoveTag, hasLatest
  } = useTags()


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
          <Show when={currentTags().length >= 6}>
            <div class="mt-1 text-xs text-amber-600 font-medium">
              You already have {currentTags().length} tags. It's recommended not to add more then 5 tags.
            </div>
          </Show>
        </TextField>
      </div>

      {/* Default Tags */}
      <div class="mt-2">
        <div class="flex items-center gap-2">
          <p class="text-xs text-gray-500 mb-1">Suggested tags:</p>

          {/* State indicator for fetch process */}
          <div class="flex items-center gap-1">
            <Switch>
              <Match when={isLoadingTags()}>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  <FaRegularCircle class="inline mr-1 text-blue-500 animate-ping" size={8}/>
                  Loading
                </span>
              </Match>
              <Match when={hasError()}>
                <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Error
                </span>
              </Match>
              <Match when={isReady()}>
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
          <Match when={hasError()}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-red-500 mb-1">Error loading
                tags: {action.fetchTags.lastErrorMessage || "Unknown error"}</p>
            </div>
          </Match>

          {/* Loading state */}
          <Match when={isLoadingTags() && !hasLatest()}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <p class="text-xs text-gray-500">Loading tags...</p>
            </div>
          </Match>

          {/* Data state */}
          <Match when={hasData() || (isLoadingTags() && hasLatest())}>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              {/* Suggested tags */}
              <For each={suggestedTags()}>
                {(tag) => (
                  <TagPill
                    label={tag.label}
                    tag={tag.tag}
                    variant="interactive"
                    count={tag.count}
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                  />
                )}
              </For>

              {/* Default tags */}
              <For each={defaultTags()}>
                {(tag) => (
                  <TagPill
                    label={tag.label}
                    tag={tag.tag}
                    variant="interactive"
                    count={tag.count}
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                  />
                )}
              </For>

              {/* Charity tags */}
              <For each={charityTags()}>
                {(tag) => (
                  <TagPill
                    label={tag.label}
                    tag={tag.tag}
                    variant="charity"
                    count={tag.count}
                    onClick={(e) => handleSelectTag(e, tag.tag, tag.label)}
                  />
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>

      {/* Current Tags */}
      <Show when={currentTags().length > 0}>
        <div class="mt-2">
          <p class="text-xs text-gray-500 mb-1">Current tags:</p>
          <div class="flex flex-wrap gap-2">
            <For each={currentTags()}>
              {(tag) => (
                <TagPill
                  label={tag.label}
                  tag={tag.tag}
                  variant="selected"
                  onRemove={() => handleRemoveTag(tag.tag)}
                />
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};

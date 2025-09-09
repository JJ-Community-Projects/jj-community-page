import {type Component, For, Show} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {useTagSearch} from "../../../../../../../../../../lib/useTagSearch.ts";
import {useStreamEditorDialog} from "../StreamEditorDialogContext.tsx";
import type {DraftTag} from "../../types/uiDraftTypes.ts";

// Minimal suggestion shape returned by useTagSearch queries
// Avoids any and captures the fields we actually use
export type TagSuggestion = {
  id: number;
  name: string;
  slug: string;
};

export const StreamTagsSection: Component<{ streamId: number }> = () => {
  const { draft, addTagLocal, removeTagLocal } = useStreamEditorDialog();
  const tagSearch = useTagSearch();

  // Use dialog-local draft tags for immediate UI feedback and local-only editing
  const tags = () => draft.tags ?? [];

  const onRemove = (tagId: number) => {
    removeTagLocal(tagId);
  };


  const onAddSuggestion = (t: TagSuggestion) => {

    // Skip if already present (id or slug/name match)
    const exists = tags().some((et) => (t.id != null && et.id === t.id) || (t.slug && et.slug === t.slug) || (t.name && et.name === t.name));
    if (exists) return;
    const newTag: DraftTag = {
      id: t.id,
      slug: t.slug,
      name: t.name,
    };
    addTagLocal(newTag);
    tagSearch.handleSearchInput("");
  };

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Tags</h3>

      <TextField value={tagSearch.searchInput?.() ?? ""} onChange={tagSearch.handleSearchInput}>
        <TextField.Label class="text-xs font-medium mb-1">Add tag</TextField.Label>
        <TextField.Input class="w-full px-3 py-2 border rounded" placeholder="Search tag" />
      </TextField>

      {/* Suggestions */}
      <Show when={tagSearch.isLoadingTags?.()}>
        <div class="text-xs text-neutral-500">Loading tags…</div>
      </Show>
      <Show when={!tagSearch.isLoadingTags?.() && tagSearch.hasTagsError?.()}>
        <div class="text-xs text-red-600">{tagSearch.availableTagsError?.()}</div>
      </Show>
      <Show when={!tagSearch.isLoadingTags?.() && (tagSearch.availableTags?.() ?? []).length > 0}>
        <div class="flex flex-wrap gap-2">
          <For each={tagSearch.availableTags!()}>{(t: TagSuggestion) => {
            const label: string = String(t.slug ?? t.name   ?? "");
            const isAlready = tags().some(et => (t.id != null && et.id === t.id) || (t.slug && et.slug === t.slug) || (t.name && et.name === t.name));
            return (
              <button
                class={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 border ${isAlready ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-300'}`}
                disabled={isAlready}
                onClick={() => onAddSuggestion(t)}
                aria-label={`Add tag ${label}`}
              >
                {label}
                {isAlready ? '✓' : '+'}
              </button>
            );
          }}</For>
        </div>
      </Show>

      <Show when={tags().length > 0}>
        <div class="flex flex-wrap gap-2">
          <For each={tags()}>{(t) => (
            <span class="inline-flex items-center gap-1 text-xs bg-neutral-200 text-neutral-800 rounded-full px-2 py-1">
              {t.slug || t.name}
              <button
                class="ml-1 text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
                onClick={() => onRemove(t.id)}
                aria-label={`Remove tag ${t.slug || t.name}`}
              >
                ×
              </button>
            </span>
          )}</For>
        </div>
      </Show>
    </div>
  );
};

export default StreamTagsSection;

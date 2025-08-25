import {type Component, For, Show} from "solid-js";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {AddTagPanel} from "./AddTagPanel.tsx";
import {TagListItem} from "./TagListItem.tsx";

interface TagSectionProps {
  categoryId: number
}

export const TagSection: Component<TagSectionProps> = (props) => {

  const tags = useQuery(
    () => orpcPrivate.adminTags.getTagsWithUsageAndAliasesByCategory.queryOptions({
      input: {
        categoryId: props.categoryId,
      }
    })
  )

  return (
    <div class="space-y-4">
      {/* Add Tag Panel */}
      <AddTagPanel categoryId={props.categoryId} />

      {/* Loading State */}
      <Show when={tags.isPending}>
        <div class="text-center py-4">
          <div class="text-sm text-gray-500">Loading tags...</div>
        </div>
      </Show>

      {/* Error State */}
      <Show when={tags.error}>
        <div class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          Error loading tags: {tags.error?.message || 'Unknown error'}
        </div>
      </Show>

      {/* Tags List */}
      <Show when={tags.isSuccess}>
        <Show when={tags.data && tags.data.length > 0} fallback={
          <div class="text-center py-8 text-gray-500 text-sm">
            No tags found in this category. Create your first tag above.
          </div>
        }>
          <div class="space-y-3">
            <For each={tags.data}>
              {(tag) => (
                <TagListItem tag={tag} />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

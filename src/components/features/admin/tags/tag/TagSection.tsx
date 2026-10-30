import {type Component, For, Show} from "solid-js";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {Alert, EmptyState, Spinner} from "../../../../ui/Status";
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
    <div class="flex flex-col gap-3">
      <AddTagPanel categoryId={props.categoryId} />

      <Show when={tags.isPending}>
        <Spinner label="Loading tags..." class="text-fg-muted" />
      </Show>

      <Show when={tags.error}>
        <Alert tone="danger">
          Error loading tags: {tags.error?.message || 'Unknown error'}
        </Alert>
      </Show>

      <Show when={tags.isSuccess}>
        <Show when={tags.data && tags.data.length > 0} fallback={
          <EmptyState title="No tags found in this category.">
            Create your first tag above.
          </EmptyState>
        }>
          <div class="flex flex-col gap-2">
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

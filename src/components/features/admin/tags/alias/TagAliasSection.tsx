import {type Component, For, Show} from "solid-js";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {AddTagAliasPanel} from "./AddTagAliasPanel.tsx";
import {TagAliasListItem} from "./TagAliasListItem.tsx";

interface TagAliasSectionProps {
  tagId: number
}

export const TagAliasSection: Component<TagAliasSectionProps> = (props) => {

  const aliases = useQuery(
    () => orpcPrivate.adminTags.getTagAliases.queryOptions({
      input: {
        tagId: props.tagId,
      }
    })
  )

  return (
    <div class="space-y-4">
      {/* Add Tag Alias Panel */}
      <AddTagAliasPanel tagId={props.tagId} />

      {/* Loading State */}
      <Show when={aliases.isPending}>
        <div class="text-center py-4">
          <div class="text-sm text-gray-500">Loading aliases...</div>
        </div>
      </Show>

      {/* Error State */}
      <Show when={aliases.error}>
        <div class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          Error loading aliases: {aliases.error?.message || 'Unknown error'}
        </div>
      </Show>

      {/* Aliases List */}
      <Show when={aliases.isSuccess}>
        <Show when={aliases.data && aliases.data.length > 0} fallback={
          <div class="text-center py-8 text-gray-500 text-sm">
            No aliases found for this tag. Create your first alias above.
          </div>
        }>
          <div class="space-y-3">
            <For each={aliases.data}>
              {(alias) => (
                <TagAliasListItem alias={alias} />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

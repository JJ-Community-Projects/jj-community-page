import {type Component, For, Show} from "solid-js";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {Alert, EmptyState, Spinner} from "../../../../ui/Status";
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
    <div class="flex flex-col gap-3">
      <AddTagAliasPanel tagId={props.tagId} />

      <Show when={aliases.isPending}>
        <Spinner label="Loading aliases..." class="text-fg-muted" />
      </Show>

      <Show when={aliases.error}>
        <Alert tone="danger">
          Error loading aliases: {aliases.error?.message || 'Unknown error'}
        </Alert>
      </Show>

      <Show when={aliases.isSuccess}>
        <Show when={aliases.data && aliases.data.length > 0} fallback={
          <EmptyState title="No aliases found for this tag.">
            Create your first alias above.
          </EmptyState>
        }>
          <div class="flex flex-col gap-2">
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

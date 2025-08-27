import {type Component, For, Show} from "solid-js";
import type {StreamTag} from "../../../../lib/orpc/public/schemas/schedules.ts";
import {TagPill} from "../../../common/TagPill.tsx";

interface StreamTagsProps {
  tags: StreamTag[];
}

/**
 * Component to display stream tags as rounded pills
 */
export const StreamTags: Component<StreamTagsProps> = (props) => {
  return (
    <Show when={props.tags && props.tags.length > 0}>
      <p class="text-lg mt-4">Tags</p>
      <div class="flex flex-wrap gap-2">
        <For each={props.tags}>
          {(tag) => (
            <TagPill
              label={tag.name}
              tag={tag.slug}
              variant="default"
            />
          )}
        </For>
      </div>
    </Show>
  );
}

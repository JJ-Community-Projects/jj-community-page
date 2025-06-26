import {type Component, For, Show} from "solid-js";
import type {TagUI} from "../../../../lib/db/models/schedule-ui.ts";
import {TagPill} from "../../../common/TagPill.tsx";

interface StreamTagsProps {
  tags: TagUI[];
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
              label={tag.label}
              tag={tag.tag}
              variant="default"
            />
          )}
        </For>
      </div>
    </Show>
  );
}

import { type Component, For, Show } from 'solid-js'
import type { StreamTag } from '../../../../lib/orpc/public/schemas/schedules.ts'
import { Chip } from '../../../ui/Labels'

/** The stream's tags in the detail dialog. */
export const StreamTags: Component<{ tags: StreamTag[] }> = (props) => (
  <Show when={props.tags && props.tags.length > 0}>
    <section class="flex flex-col gap-1.5">
      <h3 class="text-fg-muted text-xs font-semibold">Tags</h3>
      <div class="flex flex-wrap gap-1.5">
        <For each={props.tags}>
          {(tag) => (
            <Chip size="sm" color={tag.color}>
              {tag.name}
            </Chip>
          )}
        </For>
      </div>
    </section>
  </Show>
)

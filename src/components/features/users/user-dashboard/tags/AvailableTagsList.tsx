import { type Component, For, Match, Show, Switch } from 'solid-js'
import { FaSolidFire } from 'solid-icons/fa'
import { useTags } from './UserTagsProvider.tsx'
import { TagPick, tagGrid } from './TagPick.tsx'
import { Section } from '../../../../ui/Tile'
import { Alert, EmptyState, Skeleton } from '../../../../ui/Status'
import { Chip } from '../../../../ui/Labels'

/** The most used tags, to add with one click. */
export const AvailableTagsList: Component = () => {
  const { popularTags, isLoadingTags, hasTagsError, availableTagsError } =
    useTags()

  const hasTags = () => popularTags().length > 0

  return (
    <Section
      level={3}
      title="Popular Tags"
      icon={<FaSolidFire />}
      action={
        <Show when={isLoadingTags()}>
          <Chip tone="accent" size="sm">
            Loading
          </Chip>
        </Show>
      }
    >
      <Switch
        fallback={
          <EmptyState title="No tags available">
            Need help with tags? Contact Ostof on Discord.
          </EmptyState>
        }
      >
        <Match when={hasTagsError()}>
          <Alert tone="danger" title="Error loading tags">
            {availableTagsError() || 'Unknown error occurred'}
          </Alert>
        </Match>
        <Match when={isLoadingTags() && !hasTags()}>
          <div class={tagGrid}>
            <For each={Array(6)}>{() => <Skeleton class="h-9" />}</For>
          </div>
        </Match>
        <Match when={hasTags()}>
          <div class={tagGrid}>
            <For each={popularTags()}>{(tag) => <TagPick tag={tag} />}</For>
          </div>
        </Match>
      </Switch>
    </Section>
  )
}

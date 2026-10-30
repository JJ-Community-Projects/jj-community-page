import { type Component, For, Match, Switch } from 'solid-js'
import { FaSolidTag, FaSolidXmark } from 'solid-icons/fa'
import { useTags } from './UserTagsProvider.tsx'
import { tagGrid } from './TagPick.tsx'
import { Section } from '../../../../ui/Tile'
import { ListRow } from '../../../../ui/ListRow'
import { IconButton } from '../../../../ui/Button'
import { Alert, EmptyState, Skeleton } from '../../../../ui/Status'

/** The user's tags with the count against the limit; each one can be removed. */
export const UserTagsList: Component = () => {
  const {
    userTags,
    isLoadingUserTags,
    hasUserTagsError,
    handleRemoveTag,
    userTagsError,
    canAddTagToUser,
  } = useTags()

  const title = () => {
    const data = canAddTagToUser.data
    return data ? `Your Tags (${data.tags}/${data.maxTags})` : 'Your Tags'
  }

  return (
    <Section level={3} title={title()} icon={<FaSolidTag />}>
      <Switch>
        <Match when={isLoadingUserTags()}>
          <div class={tagGrid}>
            <Skeleton class="h-12" />
            <Skeleton class="h-12" />
            <Skeleton class="h-12" />
          </div>
        </Match>
        <Match when={hasUserTagsError()}>
          <Alert tone="danger" title="Error loading your tags">
            {userTagsError() || 'Unknown error occurred'}
          </Alert>
        </Match>
        <Match when={userTags().length === 0}>
          <EmptyState title="No tags added yet">
            Pick tags that show your interests, games or causes. They help
            viewers find you.
          </EmptyState>
        </Match>
        <Match when={userTags().length > 0}>
          <div class={tagGrid}>
            <For each={userTags()}>
              {(userTag) => (
                <ListRow
                  surface="group"
                  trailingAlign="center"
                  media={
                    <span
                      class="block size-3 rounded-full ring-1 ring-black/10"
                      style={{ 'background-color': userTag.tag.color }}
                    />
                  }
                  title={userTag.tag.name}
                  subline={userTag.tag.description || undefined}
                  trailing={
                    <IconButton
                      variant="ghost"
                      size="sm"
                      class="text-danger-600"
                      onClick={() => handleRemoveTag(userTag.tagId)}
                      aria-label={`Remove ${userTag.tag.name} tag`}
                      title="Remove tag"
                    >
                      <FaSolidXmark class="size-4" aria-hidden="true" />
                    </IconButton>
                  }
                />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </Section>
  )
}

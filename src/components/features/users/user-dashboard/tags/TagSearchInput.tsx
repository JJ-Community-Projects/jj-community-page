import { type Component, For, Match, Show, Switch } from 'solid-js'
import { FaSolidMagnifyingGlass, FaSolidUsers } from 'solid-icons/fa'
import { useTags } from './UserTagsProvider.tsx'
import { Section } from '../../../../ui/Tile'
import { SearchField } from '../../../../ui/Form'
import { cn } from '../../../../ui/cn'

/** Tag search with a suggestion list under the field. */
export const TagSearchInput: Component = () => {
  const {
    searchInput,
    debouncedInput,
    availableTags,
    isLoadingTags,
    hasTagsError,
    availableTagsError,
    userTags,
    canAddTag,
    handleSelectTag,
    handleSearchInput,
  } = useTags()

  return (
    <Section
      level={3}
      title="Search Tags"
      icon={<FaSolidMagnifyingGlass />}
      class="relative z-10"
    >
      <div class="relative">
        <SearchField
          label="Search for tags"
          placeholder="Search for tags"
          value={searchInput()}
          onInput={handleSearchInput}
          loading={isLoadingTags() && searchInput().length > 0}
        />

        <Show when={searchInput().length > 0}>
          <div class="rounded-tile bg-surface-strong text-fg shadow-tile-hover ring-line absolute inset-x-0 z-20 mt-2 overflow-hidden ring-1">
            <div class="max-h-64 overflow-y-auto">
              <Switch>
                <Match when={hasTagsError()}>
                  <p class="text-danger-text p-3 text-sm">
                    {availableTagsError() || 'Error loading suggestions'}
                  </p>
                </Match>
                <Match when={isLoadingTags()}>
                  <p class="text-fg-muted p-3 text-sm">Searching…</p>
                </Match>
                <Match
                  when={
                    (availableTags()?.length ?? 0) === 0 &&
                    debouncedInput().length > 0
                  }
                >
                  <p class="text-fg-muted p-3 text-sm">
                    No results for "{debouncedInput()}"
                  </p>
                </Match>
                <Match when={(availableTags()?.length ?? 0) > 0}>
                  <ul class="py-1">
                    <For each={availableTags().slice(0, 8)}>
                      {(tag) => {
                        const owned = () =>
                          userTags().some((ut) => ut.tagId === tag.id)
                        const disabled = () => owned() || !canAddTag()
                        return (
                          <li>
                            <button
                              type="button"
                              // onMouseDown: the input's blur must not swallow the click in some browsers
                              onMouseDown={(e) => handleSelectTag(e, tag.id)}
                              disabled={disabled()}
                              class={cn(
                                'hover:bg-surface flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                              )}
                              aria-label={`${owned() ? 'Already added:' : !canAddTag() ? 'Tag limit reached:' : 'Add tag:'} ${tag.name}`}
                            >
                              <span
                                class="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                                style={{ 'background-color': tag.color }}
                              />
                              <span class="min-w-0 flex-1 truncate font-semibold">
                                {tag.name}
                              </span>
                              <span class="text-fg-muted flex items-center gap-1 text-xs">
                                <FaSolidUsers class="size-3" aria-hidden="true" />
                                {tag.totalUsage}
                              </span>
                            </button>
                          </li>
                        )
                      }}
                    </For>
                  </ul>
                </Match>
              </Switch>
            </div>
          </div>
        </Show>
      </div>
    </Section>
  )
}

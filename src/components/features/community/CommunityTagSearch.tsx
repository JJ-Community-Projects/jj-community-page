import {
  type Component,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from 'solid-js'
import { FaSolidXmark } from 'solid-icons/fa'
import { useTagSearch } from '../../../lib/useTagSearch.ts'
import { cn, focusRing } from '../../ui/cn'
import { SearchField } from '../../ui/Form'

type SimpleTag = { id: number; name: string; color?: string }

/** Tag filter for the fundraiser and user lists. Shared by both community pages; ids live in their providers. */
export const CommunityTagSearch: Component<{
  selectedTagIds: number[]
  onAdd: (id: number) => void
  onRemove: (id: number) => void
}> = (props) => {
  const {
    searchInput,
    debouncedInput,
    availableTags,
    isLoadingTags,
    hasTagsError,
    availableTagsError,
    handleSearchInput,
  } = useTagSearch({ debounceMs: 300, limit: 12 })

  // local cache for tag metadata to render chips; ids live in the provider
  const [tagsById, setTagsById] = createSignal<Record<number, SimpleTag>>({})

  const addTag = (tag: SimpleTag) => {
    setTagsById((prev) => ({ ...prev, [tag.id]: tag }))
    props.onAdd(tag.id)
    handleSearchInput('')
  }

  const removeTag = (id: number) => {
    setTagsById((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    props.onRemove(id)
  }

  return (
    <div class="flex flex-col gap-2" role="search">
      <div class="relative">
        <SearchField
          label="Search tags"
          placeholder="Filter by tag…"
          value={searchInput()}
          onInput={handleSearchInput}
          loading={isLoadingTags()}
        />
        <Show when={searchInput().length > 0}>
          <div class="rounded-group bg-surface-strong text-fg shadow-tile-hover ring-line absolute inset-x-0 z-20 mt-1 max-h-64 overflow-y-auto text-sm ring-1">
            <Switch>
              <Match when={hasTagsError()}>
                <p class="text-danger-700 p-3">
                  {availableTagsError() || 'Error loading tags'}
                </p>
              </Match>
              <Match when={isLoadingTags()}>
                <p class="text-fg-muted p-3">Searching…</p>
              </Match>
              <Match
                when={
                  (availableTags()?.length ?? 0) === 0 &&
                  debouncedInput().length > 0
                }
              >
                <p class="text-fg-muted p-3">
                  No results for "{debouncedInput()}"
                </p>
              </Match>
              <Match when={(availableTags()?.length ?? 0) > 0}>
                <ul class="divide-line divide-y">
                  <For each={availableTags().slice(0, 8)}>
                    {(tag: any) => (
                      <li>
                        <button
                          type="button"
                          class={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5',
                            focusRing,
                          )}
                          // onMouseDown avoids input blur issues
                          onMouseDown={() =>
                            addTag({
                              id: tag.id,
                              name: tag.name,
                              color: tag.color,
                            })
                          }
                        >
                          <span
                            class="size-2 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ 'background-color': tag.color }}
                          />
                          <span class="flex-1 truncate font-medium">
                            {tag.name}
                          </span>
                          <span class="text-fg-muted text-xs">add</span>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Match>
            </Switch>
          </div>
        </Show>
      </div>

      <Show when={props.selectedTagIds.length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={props.selectedTagIds}>
            {(id) => {
              const tag = () => tagsById()[id] || { id, name: `#${id}` }
              return (
                <button
                  type="button"
                  onClick={() => removeTag(id)}
                  class={cn(
                    'bg-surface-strong text-fg ring-line hover:bg-surface inline-flex items-center gap-1.5 rounded-full py-1 pr-2 pl-2.5 text-xs font-medium ring-1',
                    focusRing,
                  )}
                  aria-label={`Remove tag ${tag().name}`}
                >
                  <span
                    class="size-2 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ 'background-color': tag().color ?? 'transparent' }}
                  />
                  {tag().name}
                  <FaSolidXmark
                    class="text-fg-muted size-3"
                    aria-hidden="true"
                  />
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}

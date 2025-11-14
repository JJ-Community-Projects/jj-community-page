import { For, Match, Show, Switch, createSignal, type Component } from 'solid-js'
import { useTagSearch } from '../../../lib/useTagSearch.ts'
import { twMerge } from 'tailwind-merge'
import { useCommunityPage } from './CommunityPageProvider.tsx'

type SimpleTag = { id: number; name: string; color?: string }

export const CommunityTagSearch: Component = () => {
  const { addSelectedTag, removeSelectedTag, selectedTagIds } = useCommunityPage()
  const {
    searchInput,
    debouncedInput,
    availableTags,
    isLoadingTags,
    hasTagsError,
    availableTagsError,
    handleSearchInput,
  } = useTagSearch({ debounceMs: 300, limit: 12 })

  // local cache for tag metadata to render chips; ids live in provider
  const [tagsById, setTagsById] = createSignal<Record<number, SimpleTag>>({})

  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement
    handleSearchInput(t.value)
  }

  const clearInput = () => handleSearchInput('')

  const addTag = (tag: SimpleTag) => {
    setTagsById((prev) => ({ ...prev, [tag.id]: tag }))
    addSelectedTag(tag.id)
    clearInput()
  }

  const removeTag = (id: number) => {
    setTagsById((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    removeSelectedTag(id)
  }

  const showSuggestions = () => searchInput().length > 0

  return (
    <div class={twMerge('mt-2 rounded-xl border-2 bg-white/95 p-3 shadow-md')}
         role="search">
      <div class="relative">
        <input
          type="text"
          class={twMerge(
            'w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
          )}
          placeholder="Search tags…"
          value={searchInput()}
          onInput={onInput}
          aria-label="Search tags"
        />

        <Show when={searchInput().length > 0}>
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            onClick={clearInput}
            aria-label="Clear search"
          >
            Clear
          </button>
        </Show>

        <Show when={showSuggestions()}>
          <div class="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border bg-white shadow-xl">
            <div class="max-h-64 overflow-y-auto text-sm">
              <Switch>
                <Match when={hasTagsError()}>
                  <div class="p-3 text-danger-600">
                    {availableTagsError() || 'Error loading tags'}
                  </div>
                </Match>
                <Match when={isLoadingTags()}>
                  <div class="p-3 text-gray-500">Searching…</div>
                </Match>
                <Match when={(availableTags()?.length ?? 0) === 0 && debouncedInput().length > 0}>
                  <div class="p-3 text-gray-500">No results for "{debouncedInput()}"</div>
                </Match>
                <Match when={(availableTags()?.length ?? 0) > 0}>
                  <ul class="divide-y">
                    <For each={availableTags().slice(0, 8)}>
                      {(tag: any) => (
                        <li>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                            // onMouseDown avoids input blur issues
                            onMouseDown={() => addTag({ id: tag.id, name: tag.name, color: tag.color })}
                          >
                            <span class="truncate font-medium" style={{ color: tag.color }}>{tag.name}</span>
                            <span class="ml-3 text-xs text-gray-500">add</span>
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </Match>
              </Switch>
            </div>
          </div>
        </Show>
      </div>

      {/* Selected tags (ids from provider) */}
      <Show when={selectedTagIds().length > 0}>
        <div class="mt-3 flex flex-wrap gap-2">
          <For each={selectedTagIds()}>
            {(id) => {
              const tag = () => tagsById()[id] || { id, name: `#${id}`, color: '#888888' }
              return (
              <button
                type="button"
                onClick={() => removeTag(id)}
                class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                style={{ 'border-color': tag().color || '#ddd', color: tag().color || '#333', background: 'white' }}
                title={`Remove ${tag().name}`}
              >
                <span>{tag().name}</span>
                <span aria-hidden>×</span>
              </button>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default CommunityTagSearch

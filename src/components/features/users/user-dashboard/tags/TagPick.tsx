import { type Component } from 'solid-js'
import { FaSolidUsers } from 'solid-icons/fa'
import { useTags } from './UserTagsProvider.tsx'
import { cn, focusRing, groupSurface } from '../../../../ui/cn'

type PickTag = { id: number; name: string; color: string; totalUsage: number }

/** A tag to add (popular tags, a category's tags): colour dot, name, usage. Disabled when owned or at the limit. */
export const TagPick: Component<{ tag: PickTag }> = (props) => {
  const { userTags, canAddTag, handleSelectTag } = useTags()
  const owned = () => userTags().some((ut) => ut.tagId === props.tag.id)
  return (
    <button
      type="button"
      onClick={(e) => handleSelectTag(e, props.tag.id)}
      disabled={owned() || !canAddTag()}
      class={cn(
        groupSurface,
        focusRing,
        'hover:bg-surface disabled:hover:bg-surface-strong flex w-full min-w-0 cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      )}
      aria-label={`${owned() ? 'Already added:' : !canAddTag() ? 'Tag limit reached:' : 'Add tag:'} ${props.tag.name}`}
      aria-pressed={owned()}
    >
      <span
        class="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ 'background-color': props.tag.color }}
      />
      <span class="min-w-0 flex-1 truncate text-sm font-semibold">
        {props.tag.name}
      </span>
      <span class="text-fg-muted flex shrink-0 items-center gap-1 text-xs">
        <FaSolidUsers class="size-3" aria-hidden="true" />
        {owned() ? 'Added' : props.tag.totalUsage}
      </span>
    </button>
  )
}

/** The grid TagPick buttons sit in. */
export const tagGrid = 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'

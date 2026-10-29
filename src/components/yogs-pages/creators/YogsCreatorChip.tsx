import { type Component } from 'solid-js'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'
import { Avatar } from '../../ui/Avatar'
import { cn, focusRing } from '../../ui/cn'

/** Fallback when a creator has no colour (as the old pills had). */
export const CREATOR_FALLBACK_COLOR = '#1E95EF'

interface YogsCreatorChipProps {
  creator: YogsCreator
  onClick: () => void
  class?: string
}

/** A creator as a white chip; the creator's colour survives as the avatar ring (D3). */
export const YogsCreatorChip: Component<YogsCreatorChipProps> = (props) => (
  <button
    type="button"
    class={cn(
      'bg-surface-strong text-fg ring-line inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-sm font-semibold ring-1 transition-shadow hover:shadow-tile',
      focusRing,
      props.class,
    )}
    onClick={() => props.onClick()}
  >
    <Avatar
      src={props.creator.imageUrl}
      alt=""
      fallback={props.creator.name.charAt(0)}
      size="xs"
      shape="circle"
      ringColor={props.creator.color ?? CREATOR_FALLBACK_COLOR}
      class="ring-2"
    />
    <span class="truncate">{props.creator.name}</span>
  </button>
)

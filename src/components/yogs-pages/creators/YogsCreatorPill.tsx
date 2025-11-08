import { type Component } from 'solid-js'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { logCreator } from '../../../lib/analytics.ts'
import { YogsCreatorDialog } from './YogsCreatorDialog.tsx'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'

interface CreatorPillProps {
  creator: YogsCreator
  label?: string
  url?: string
}

export const YogsCreatorPill: Component<CreatorPillProps> = (props) => {
  const creator = props.creator
  const imageUrl = creator?.imageUrl
  const bg = creator?.color ?? '#1E95EF'
  const textColor = getTextColor(bg)

  const label = props.label ?? creator.name

  const modal = createModalSignal()

  return (
    <>
      <button
        class="flex cursor-pointer flex-row items-center gap-2 rounded-full p-2 transition-all duration-200 hover:scale-105 hover:brightness-105"
        style={{
          'background-color': bg,
          color: textColor,
        }}
        onclick={() => {
          modal.open()
          logCreator(creator)
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={label}
            height="32"
            width="32"
            class="h-8 w-8 rounded-full"
          />
        )}
        <span>{label}</span>
      </button>
      <YogsCreatorDialog creator={creator} modalSignal={modal} />
    </>
  )
}

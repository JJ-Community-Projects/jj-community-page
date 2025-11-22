import type { YogsStream } from '../../../lib/orpc/private/yogs/contract.ts'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js'
import { createModalSignal } from '../../../lib/createModalSignal.ts'
import { useCreatorFilter } from './provider/CreatorFilterProvider.tsx'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import { twMerge } from 'tailwind-merge'

interface YogsStreamTileProps {
  stream: YogsStream
}

const useHeightObserver = () => {
  const [ref, setRef] = createSignal(null)
  const [height, setHeight] = createSignal(0)
  const [width, setWidth] = createSignal(0)

  const resizeObserver = new ResizeObserver((entries) => {
    if (entries[0]) {
      setHeight(Math.floor(entries[0].contentRect.height))
      setWidth(Math.floor(entries[0].contentRect.width))
    }
  })

  createEffect(() => {
    const r = ref()
    if (r) {
      resizeObserver.observe(r)
    }
  })

  onCleanup(() => {
    resizeObserver.disconnect()
  })

  return {
    setRef,
    height,
    width,
  }
}

interface SizingOptions {
  lineHeightFactor: number // e.g., 1.2
  letterSpacingPx: number // e.g., 0 for no extra spacing
}

// NOTE: You must update this function with your actual text measurement utility.
// It now accepts line height and letter spacing.
const measureTextHeight = (
  text: string,
  fontSize: number,
  containerWidth: number,
  options: SizingOptions,
): number => {
  // --- Updated Placeholder Logic ---
  const { lineHeightFactor, letterSpacingPx } = options

  // Calculate the effective line height
  const lineHeight = fontSize * lineHeightFactor

  // Estimate character width (approximation: 0.6 is common factor, plus letter spacing)
  const charWidth = fontSize * 0.6 + letterSpacingPx

  // Calculate how many characters fit per line
  const charactersPerLine = Math.floor(containerWidth / charWidth)

  // Calculate the number of lines (handle empty string case)
  const textLength = text.length || 1
  const lines = Math.ceil(textLength / charactersPerLine)

  // Total height
  return lines * lineHeight
}

interface FontSizes {
  title: number
  subtitle: number
}

const useFittedFontSizes = (
  slotHeight: () => number,
  title: () => string,
  subtitle: () => string | undefined,
  containerWidth: () => number,
  titleOptions: SizingOptions,
  subtitleOptions: SizingOptions,
): (() => FontSizes) => {
  return createMemo(() => {
    // H_max is now the full slot height, as requested.
    const H_max = slotHeight()

    // W_content uses the full container width (you may still need to subtract the 'p-1' horizontal padding here if it affects text wrapping)
    const W_content = containerWidth() - 8 * 2 // Assuming p-1 results in 8px horizontal padding (adjust as needed)

    const isSubtitlePresent = !!subtitle()
    const FS_max = 40
    const FS_min = 12

    let H_title_max: number
    let FS_subtitle: number

    if (isSubtitlePresent) {
      // --- Case 1: Subtitle IS Present (Ratio-based division) ---
      const Title_Ratio = 0.65
      const Subtitle_Ratio = 0.9
      const Gap_Height = 4 // Small fixed gap between title and subtitle

      // Initial subtitle size guess
      const H_subtitle_max = H_max * Subtitle_Ratio - Gap_Height / 2
      FS_subtitle = Math.min(Math.min(FS_max * 0.5, 16), H_subtitle_max)

      // Final check for subtitle size
      for (let fs = FS_subtitle; fs >= 8; fs--) {
        const H_calc = measureTextHeight(
          subtitle()!,
          fs,
          W_content,
          subtitleOptions,
        )
        if (H_calc <= H_subtitle_max) {
          FS_subtitle = fs
          break
        }
      }

      // Title gets the remaining space
      const H_subtitle_final = measureTextHeight(
        subtitle()!,
        FS_subtitle,
        W_content,
        subtitleOptions,
      )
      H_title_max = H_max - H_subtitle_final - Gap_Height
    } else {
      // --- Case 2: Subtitle IS NOT Present (Title uses full height) ---
      H_title_max = H_max
      FS_subtitle = 0 // Subtitle font size is zero or irrelevant
    }

    // --- 3. Size the Title (Iterative Search) ---
    let FS_title = FS_min // Start with min as fallback

    for (let fs = FS_max; fs >= FS_min; fs--) {
      const H_calc = measureTextHeight(title(), fs, W_content, titleOptions)
      if (H_calc <= H_title_max) {
        FS_title = fs
        break
      }
    }

    // Ensure the title font size is not below the minimum
    FS_title = Math.max(FS_title, FS_min)

    return {
      title: FS_title,
      subtitle: FS_subtitle,
    }
  })
}

export const YogsStreamTileDebug: Component<YogsStreamTileProps> = (props) => {
  const modal = createModalSignal()

  const { isSlotPartOfFilter } = useCreatorFilter()

  const stream = () => props.stream
  const title = () => stream().title
  const subtitle = () => stream().subtitle ?? ''
  const tileSize = () => stream().size
  const enable = () => isSlotPartOfFilter(stream())
  const color = () => stream().color

  const { setRef: setInnerRef, height: slotHeight, width } = useHeightObserver()

  const fittedFontSizes = useFittedFontSizes(
    slotHeight,
    title,
    subtitle,
    width,
    {
      lineHeightFactor: 1,
      letterSpacingPx: 2,
    },
    {
      lineHeightFactor: 1,
      letterSpacingPx: 1,
    },
  )

  const buttonStyle = () => {
    if (enable()) {
      return {
        'background-color': color(),
        color: getTextColor(color()),
      }
    } else {
      return {
        'background-color': color(),
        color: getTextColor(color()),
        filter: 'brightness(0.5)',
      }
    }
  }

  return (
    <div
      style={{
        height: `calc(${props.stream.size} * var(--jj-schedule-data-size))`,
        width: '100%',
      }}
      class="p-0.5"
    >
      <div
        ref={setInnerRef}
        class={twMerge(
          'flex h-full w-full flex-col items-center justify-center rounded-2xl p-1 text-center transition-all',
          enable() ? 'hover:scale-101 wide hover:brightness-105' : '',
        )}
        style={buttonStyle()}
      >
        <p
          style={{
            'font-size': `${fittedFontSizes().title}px`,
          }}
        >
          {title()}
        </p>
        {subtitle() && (
          <p
            style={{
              'font-size': `${fittedFontSizes().subtitle}px`,
            }}
          >
            {subtitle()}
          </p>
        )}
      </div>
    </div>
  )
}

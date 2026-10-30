import { type Component, createSignal, For } from 'solid-js'
import {
  FaSolidChevronLeft,
  FaSolidChevronRight,
  FaSolidXmark,
} from 'solid-icons/fa'
import { IconButton } from '../ui/Button'
import { cn, focusRing } from '../ui/cn'

import panel1 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_1.png'
import panel2 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_2.png'
import panel3 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_3.png'
import overlay1 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_1.png'
import overlay2 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_2.png'
import overlay3 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_3.png'
import overlay4 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_4.png'

export const PANEL_EXTENSION_URL =
  'https://dashboard.twitch.tv/extensions/7m5fitr4o8raxn6fv59lndv2iy0uuz'
export const OVERLAY_EXTENSION_URL =
  'https://dashboard.twitch.tv/extensions/9urrg74yzq8di9hqr5prsto5lbmq3x'
export const panelImages = [panel1, panel2, panel3]
export const overlayImages = [overlay1, overlay2, overlay3, overlay4]

/** Screenshot viewer with thumbnails; a click opens the image full size. */
export const Carousel: Component<{ images: ImageMetadata[]; alt: string }> = (
  props,
) => {
  const [idx, setIdx] = createSignal(0)
  const [lightbox, setLightbox] = createSignal<null | number>(null)

  const count = () => props.images.length
  const prev = () => setIdx((i) => (i - 1 + count()) % count())
  const next = () => setIdx((i) => (i + 1) % count())
  return (
    <div class="w-full max-w-xl select-none">
      <div class="rounded-media ring-line relative aspect-4/3 w-full overflow-hidden bg-black/5 ring-1">
        <img
          src={props.images[idx()].src}
          alt={`${props.alt} ${idx() + 1}`}
          class="h-full w-full cursor-zoom-in object-contain"
          loading="lazy"
          onClick={() => setLightbox(idx())}
        />
        <IconButton
          aria-label="Previous screenshot"
          variant="canvas"
          size="sm"
          class="absolute top-1/2 left-2 -translate-y-1/2"
          onClick={prev}
        >
          <FaSolidChevronLeft class="size-3" aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-label="Next screenshot"
          variant="canvas"
          size="sm"
          class="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={next}
        >
          <FaSolidChevronRight class="size-3" aria-hidden="true" />
        </IconButton>
      </div>
      <div class="mt-2 flex justify-center gap-2">
        <For each={props.images}>
          {(src, i) => (
            <button
              class={cn(
                'rounded-media ring-line h-12 w-16 overflow-hidden bg-black/5 opacity-60 ring-1 transition hover:opacity-100',
                focusRing,
                i() === idx() && 'ring-accent opacity-100 ring-2',
              )}
              onClick={() => setIdx(i())}
              aria-label={`Show screenshot ${i() + 1}`}
            >
              <img
                src={src.src}
                alt=""
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          )}
        </For>
      </div>

      {lightbox() !== null && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <IconButton
            aria-label="Close"
            variant="canvas"
            class="absolute top-4 right-4"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              setLightbox(null)
            }}
          >
            <FaSolidXmark class="size-4" aria-hidden="true" />
          </IconButton>
          <img
            src={props.images[lightbox() ?? 0].src}
            alt={`${props.alt} ${(lightbox() ?? 0) + 1}, enlarged`}
            class="rounded-media max-h-[90vh] max-w-[90vw] shadow-lg"
          />
        </div>
      )}
    </div>
  )
}

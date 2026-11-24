import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { ORPCError } from '@orpc/client'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { cn } from '../../../ui/cn'
import jjLogo from '../../../../images/Jingle_Jam_Logo_White_168.webp'
import jjLogoBlue from '../../../../images/Jingle_Jam_Logo_DARK_168.webp'
import {
  BANNER_MS,
  SPIN_MS,
  swatchIndex,
  targetRotation,
  WHEEL_MIN_ITEMS,
  WHEEL_THEMES,
  type WheelTheme,
  winnerIndex,
} from './wheel.ts'

export type WheelOverlayProps = {
  items: string[]
  theme: WheelTheme
  /** The overlay link's user id + key; without them the wheel only spins on click (preview). */
  user?: number
  wheelKey?: string
}

// SVG units: the wheel is drawn in a 200 × 200 box centred on 0,0
const RIM = 91
const RADIUS = 87
const HUB = 22
const TEXT_START = RADIUS - 5
const TEXT_LENGTH = TEXT_START - HUB - 5

/** Point at `deg` (clockwise from the top) and radius `r`. */
const at = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return `${(r * Math.sin(rad)).toFixed(3)} ${(-r * Math.cos(rad)).toFixed(3)}`
}

const segmentPath = (index: number, count: number) => {
  const size = 360 / count
  const start = index * size
  const end = start + size
  const large = size > 180 ? 1 : 0
  return `M0 0 L${at(start, RADIUS)} A${RADIUS} ${RADIUS} 0 ${large} 1 ${at(end, RADIUS)} Z`
}

const fontSize = (text: string, count: number) => {
  const byLength = TEXT_LENGTH / (Math.max(text.length, 1) * 0.7)
  const byWidth = 2 * 55 * Math.sin(Math.PI / count) * 0.75
  return Math.max(3.5, Math.min(13, byLength, byWidth))
}

type Status = 'local' | 'connecting' | 'live' | 'refused'

export const WheelOverlay: Component<WheelOverlayProps> = (props) => {
  const palette = () => WHEEL_THEMES[props.theme]
  const swatch = (index: number) =>
    palette().swatches[swatchIndex(index, props.items.length, palette().swatches.length)]
  const canSpin = () => props.items.length >= WHEEL_MIN_ITEMS

  let spinner!: HTMLDivElement
  let rotation = 0
  let bannerTimer: ReturnType<typeof setTimeout> | undefined
  const [spinning, setSpinning] = createSignal(false)
  // The last result stays set while the banner fades out; `shown` drives banner + dimming
  const [result, setResult] = createSignal<number | null>(null)
  const [shown, setShown] = createSignal(false)
  const winner = () => (shown() ? result() : null)
  const [status, setStatus] = createSignal<Status>(
    props.user && props.wheelKey ? 'connecting' : 'local',
  )

  const spin = (r: number) => {
    const count = props.items.length
    if (!canSpin() || spinning()) return
    clearTimeout(bannerTimer)
    setShown(false)
    setSpinning(true)
    const from = rotation
    const to = targetRotation(from, r, count)
    const animation = spinner.animate(
      [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
      // Starts at full speed, like a flick, then a long slow-down
      { duration: SPIN_MS, easing: 'cubic-bezier(0.12, 0.6, 0.08, 1)', fill: 'forwards' },
    )
    animation.finished
      .then(() => {
        rotation = to % 360
        spinner.style.transform = `rotate(${rotation}deg)`
        animation.cancel()
        setSpinning(false)
        setResult(winnerIndex(r, count))
        setShown(true)
        bannerTimer = setTimeout(() => setShown(false), BANNER_MS)
      })
      .catch(() => setSpinning(false))
  }

  onCleanup(() => clearTimeout(bannerTimer))

  // The dashboard's Spin: listen on the user's wheel channel. The socket reconnects and renews its
  // token by itself; this loop only retries a failed first call and stops on a refused key.
  onMount(() => {
    const userId = props.user
    const key = props.wheelKey
    if (!userId || !key) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    const refuse = () => {
      setStatus('refused')
      controller.abort()
    }

    void (async () => {
      let delay = 2000
      while (!controller.signal.aborted) {
        try {
          const events = await orpcPrivate.wheelWS.subscribe.call(
            { userId, key },
            {
              signal: controller.signal,
              context: { tokenRenewal: { onRefused: refuse } },
            },
          )
          setStatus('live')
          delay = 2000
          for await (const event of events) {
            if (event.event === 'spin') spin(event.r)
          }
        } catch (error) {
          if (controller.signal.aborted) return
          if (error instanceof ORPCError && error.code === 'UNAUTHORIZED') return refuse()
          console.error('wheel subscription', error)
        }
        setStatus('connecting')
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.min(delay * 2, 30_000)
      }
    })()
  })

  const resultSwatch = () => {
    const r = result()
    return r === null ? undefined : swatch(r)
  }

  return (
    <div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-transparent">
      <div
        class="relative aspect-square w-[min(100vw,100vh)] cursor-pointer select-none"
        onClick={() => spin(Math.random())}
      >
        {/* The turning part: segments, labels, separators */}
        <div ref={spinner} class="absolute inset-0 will-change-transform">
          <svg viewBox="-100 -100 200 200" class="size-full" aria-hidden="true">
            <circle r={RADIUS} fill="#111" />
            <For each={props.items}>
              {(item, i) => {
                const centre = () => (i() + 0.5) * (360 / props.items.length)
                const dimmed = () => winner() !== null && winner() !== i()
                return (
                  <g
                    class="transition-opacity duration-500"
                    style={{ opacity: dimmed() ? 0.35 : 1 }}
                  >
                    <path
                      d={segmentPath(i(), props.items.length)}
                      style={{ fill: swatch(i()).fill }}
                      stroke="rgba(255,255,255,0.85)"
                      stroke-width="0.6"
                    />
                    {/* Reads from the rim towards the hub, like a hand-lettered wheel */}
                    <text
                      transform={`rotate(${centre()}) translate(0 ${-TEXT_START}) rotate(90)`}
                      font-size={fontSize(item, props.items.length).toFixed(2)}
                      font-weight="800"
                      dominant-baseline="central"
                      stroke="rgba(0,0,0,0.25)"
                      stroke-width="0.5"
                      paint-order="stroke"
                      style={{ fill: swatch(i()).text, 'letter-spacing': '0.02em' }}
                    >
                      {item}
                    </text>
                  </g>
                )
              }}
            </For>
          </svg>
        </div>

        {/* The fixed part: rim, hub, pointer */}
        <svg
          viewBox="-100 -100 200 200"
          class="pointer-events-none absolute inset-0 size-full"
          aria-hidden="true"
        >
          <defs>
            <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.5" />
            </filter>
          </defs>
          <circle r={RIM} fill="none" stroke="#111" stroke-width="6" />
          <circle r={RIM + 3} fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.8" />
          <circle r={RIM - 3} fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.5" />
          <circle r={HUB} fill="#111" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" />
          <path
            d="M-7 -99 L7 -99 L7 -88 L0 -79 L-7 -88 Z"
            style={{ fill: palette().pointer }}
            stroke="#111"
            stroke-width="1.2"
            stroke-linejoin="round"
            filter="url(#wheel-shadow)"
          />
        </svg>
        <img
          src={props.theme === 'blue' ? jjLogoBlue.src : jjLogo.src}
          alt=""
          class="pointer-events-none absolute top-1/2 left-1/2 w-[17%] -translate-x-1/2 -translate-y-1/2"
        />

        <Show when={!canSpin()}>
          <p class="absolute inset-x-[15%] top-[60%] rounded-lg bg-black/70 px-3 py-2 text-center text-[3.5vmin] text-white">
            Add at least {WHEEL_MIN_ITEMS} items
          </p>
        </Show>

        <div
          class={cn(
            'pointer-events-none absolute inset-x-[8%] top-1/2 flex -translate-y-1/2 justify-center transition duration-300 ease-out',
            shown() ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
          )}
          aria-live="polite"
        >
          <p
            class="max-w-full rounded-2xl border-[0.6vmin] border-white px-[4vmin] py-[2vmin] text-center text-[7vmin] leading-tight font-extrabold wrap-break-word shadow-2xl"
            style={{
              background: resultSwatch()?.fill ?? 'transparent',
              color: resultSwatch()?.text ?? 'transparent',
            }}
          >
            {result() === null ? '' : props.items[result()!]}
          </p>
        </div>
      </div>

      <Show when={status() === 'refused'}>
        <p class="absolute inset-x-0 bottom-2 mx-auto w-fit rounded bg-black/70 px-3 py-1 text-sm text-white">
          This wheel link is not valid. Copy it again from the overlays page.
        </p>
      </Show>
    </div>
  )
}

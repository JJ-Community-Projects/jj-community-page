import {
  type Component,
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  on,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
} from 'solid-js'
import { FaSolidCheck, FaSolidCopy } from 'solid-icons/fa'
import { Button } from '../../../ui/Button'
import { cn } from '../../../ui/cn'
import { fieldClass, Segmented } from '../../../ui/Form'
import { Select } from '../../../ui/Select'
import { Tile } from '../../../ui/Tile'
import type { OverlayFormat, OverlaySize } from './formats'

// Small helper to build URLs safely
export function buildUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined | string[]>,
) {
  const url = new URL(
    path,
    typeof window !== 'undefined' ? window.location.origin : 'https://jinglejam.ostof.dev',
  )
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return
    if (Array.isArray(v)) {
      v.forEach((val) => url.searchParams.append(k, String(val)))
    } else if (typeof v === 'boolean') {
      url.searchParams.set(k, v ? '1' : '0')
    } else {
      url.searchParams.set(k, String(v))
    }
  })
  return url.toString()
}

/** Option text for lowercase URL values (`red` → "Red"). */
export const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

/** Select value for "nothing chosen": Kobalte shows an empty trigger for `''`. */
export const NO_CHOICE = '__none'

export const CURRENCIES =['GBP', 'USD', 'EUR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const CurrencySelect: Component<{
  value: Currency
  onChange: (value: Currency) => void
}> = (p) => (
  <Select
    label="Currency"
    showLabel
    options={[...CURRENCIES]}
    value={p.value}
    onChange={p.onChange}
    format={(v) => v}
  />
)

export type PreviewDataMode = 'test' | 'live'

// Preview source switch used by configurators whose overlay supports `?demo=1`.
// Only affects the embedded preview iframe; the copyable OBS URL stays live.
export const PreviewDataField: Component<{
  value: PreviewDataMode
  onChange: (v: PreviewDataMode) => void
}> = (p) => (
  <div class="flex flex-col items-start gap-1 sm:col-span-2">
    <span class={fieldClass.label} aria-hidden="true">
      Preview data
    </span>
    <Segmented
      label="Preview data"
      size="sm"
      options={[
        { value: 'test', label: 'Example' },
        { value: 'live', label: 'Live data' },
      ]}
      value={p.value}
      onChange={(v) => p.onChange(v as PreviewDataMode)}
    />
    <p class={fieldClass.help}>
      Example data is fake sample charities and fundraisers, shown only in this
      preview. Your copied OBS link always shows live data.
    </p>
  </div>
)

/** The OBS link: read-only field, Copy with "Copied" feedback, and Open. */
export const CopyLink: Component<{ url: string }> = (p) => {
  const id = createUniqueId()
  const [state, setState] = createSignal<'idle' | 'copied' | 'failed'>('idle')
  let input!: HTMLInputElement
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  // A changed option makes a new link: drop the old feedback
  createEffect(on(() => p.url, () => setState('idle'), { defer: true }))

  const copy = async () => {
    clearTimeout(timer)
    try {
      await navigator.clipboard.writeText(p.url)
      setState('copied')
      timer = setTimeout(() => setState('idle'), 2000)
    } catch {
      input.select()
      setState('failed')
    }
  }

  return (
    <div class="flex flex-col gap-1">
      <label for={id} class={fieldClass.label}>
        OBS browser source link
      </label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          ref={input}
          id={id}
          readOnly
          value={p.url}
          onFocus={(e) => e.currentTarget.select()}
          class={cn(fieldClass.input, 'h-10 min-w-0 flex-1 font-mono text-xs')}
        />
        <div class="flex gap-2">
          <Button variant="accent" onClick={copy} class="flex-1 sm:flex-none">
            <Show
              when={state() === 'copied'}
              fallback={<FaSolidCopy class="size-3.5" aria-hidden="true" />}
            >
              <FaSolidCheck class="size-3.5" aria-hidden="true" />
            </Show>
            {state() === 'copied' ? 'Copied' : 'Copy link'}
          </Button>
          <Button href={p.url} target="_blank" rel="noopener">
            Open
          </Button>
        </div>
      </div>
      <p aria-live="polite" class={fieldClass.help}>
        <Show when={state() === 'failed'}>
          Copying didn't work: the link is selected, press Ctrl+C (⌘C on a Mac).
        </Show>
      </p>
    </div>
  )
}

/** The overlay at its own size in an iframe, scaled down to the available width. */
export const OverlayPreview: Component<{
  url: string
  size: OverlaySize
  class?: string
}> = (p) => {
  const [width, setWidth] = createSignal(0)
  let box!: HTMLDivElement
  onMount(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(box)
    onCleanup(() => observer.disconnect())
  })
  const scale = () => (width() ? Math.min(1, width() / p.size.width) : 1)

  return (
    <div
      ref={box}
      class={cn('flex flex-col gap-1', p.class)}
      style={{ width: `${p.size.width}px`, 'max-width': '100%' }}
    >
      {/* Dark backdrop: most overlays are transparent with white text */}
      <div
        class="rounded-group ring-line overflow-hidden bg-neutral-800 ring-1"
        style={{ height: `${p.size.height * scale()}px` }}
      >
        <iframe
          src={p.url}
          title="Overlay preview"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          width={p.size.width}
          height={p.size.height}
          // Same scheme as the overlay page: a mismatch in dark mode paints the transparent iframe opaque
          class="scheme-light block origin-top-left border-0"
          style={{ transform: `scale(${scale()})` }}
        />
      </div>
      <p class={fieldClass.help}>
        Preview, {p.size.width}×{p.size.height}
        <Show when={scale() < 1}> at {Math.round(scale() * 100)}%</Show>
      </p>
    </div>
  )
}

/** One configurator: description, options next to (or above) the preview, then the link. */
export const ConfiguratorBody: ParentComponent<{
  description: JSX.Element
  format: OverlayFormat
  previewUrl: string
  /** The OBS link; when missing, `noLink` explains why. */
  linkUrl?: string
  noLink?: JSX.Element
}> = (p) => {
  // Strips (tickers, ribbons) get the full width below the options
  const wide = () => p.format.preview.width > 640
  return (
    <Tile class="flex flex-col gap-4">
      <p class="text-fg-muted max-w-prose text-sm">{p.description}</p>
      <div
        class={cn('flex flex-col gap-4', !wide() && 'lg:flex-row lg:items-start')}
      >
        <div class="grid min-w-0 flex-1 content-start gap-4 sm:grid-cols-2">
          {p.children}
        </div>
        <OverlayPreview
          url={p.previewUrl}
          size={p.format.preview}
          class="shrink-0"
        />
      </div>
      <Show when={p.linkUrl} fallback={p.noLink}>
        {(url) => <CopyLink url={url()} />}
      </Show>
    </Tile>
  )
}

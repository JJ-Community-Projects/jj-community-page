import { type Component } from 'solid-js'
import { twMerge } from 'tailwind-merge'

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

export const FieldRow: Component<{ label: string; children: any }> = (p) => (
  <label class="flex items-center gap-2 text-sm">
    <span class="w-40 opacity-80">{p.label}</span>
    <div class="flex-1">{p.children}</div>
  </label>
)

export const LinkPreview: Component<{ url: string }> = (p) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.url)
    } catch {}
  }
  return (
    <div class="mt-2 flex items-center gap-2">
      <a
        href={p.url}
        target="_blank"
        class="truncate rounded bg-black/40 px-2 py-1 text-xs underline"
      >
        {p.url}
      </a>
      <button class="rounded bg-primary-500 px-2 py-1 text-xs" onClick={copy}>
        Copy
      </button>
    </div>
  )
}

// Lightweight live preview frame for an overlay URL
export const PreviewFrame: Component<{ url: string; visible?: boolean; class?: string }> = (p) => (
  <div class="mt-3 rounded border border-accent-500/50 bg-black/50">
    <iframe
      src={p.visible ? p.url : 'about:blank'}
      title="Overlay preview"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin"
      class={twMerge("h-[320px] w-full rounded", p.class)}
    />
  </div>
)

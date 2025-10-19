import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../overview/Common.tsx'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'

type Theme2 = 'default' | 'red' | 'blue' | 'carousel'
type HeaderTheme2 = 'default' | 'red' | 'blue'

export const CharitiesConfigurator: Component<{ visible?: boolean }> = (p) => {
  // Header selection via checkboxes (mirrors V1 behavior but easier UX)
  const headerOptions = ['Title', 'Donate', 'JJLink'] as const
  const [selectedHeaders, setSelectedHeaders] = createSignal<string[]>([
    'Title',
    'JJLink',
  ])
  const [speed, setSpeed] = createSignal<number>(5)
  const [includeTotals2, setIncludeTotals2] = createSignal<boolean>(false)
  const [theme2, setTheme2] = createSignal<Theme2>('default')
  const [headerTheme2, setHeaderTheme2] = createSignal<HeaderTheme2>('default')
  const [showDesc, setShowDesc] = createSignal<boolean>(false)
  const [showQRCode, setShowQRCode] = createSignal<boolean>(false)
  const [showUrl, setShowUrl] = createSignal<boolean>(true)
  const [selectedIds, setSelectedIds] = createSignal<number[]>([])

  // Fetch charities list via oRPC for checkbox selection
  const q = useQuery(() =>
    orpcPrivate.overlay.charities.queryOptions({
      input: { includeTotals: includeTotals2() },
    }),
  )
  const charities = () => q.data?.charities ?? []
  const allSelected = () =>
    selectedIds().length > 0 && selectedIds().length === charities().length
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? charities().map((c) => Number(c.id)) : [])
  const toggleOne = (id: number, checked: boolean) => {
    const set = new Set(selectedIds())
    if (checked) set.add(id)
    else set.delete(id)
    setSelectedIds(Array.from(set))
  }

  const causesParam = createMemo(() =>
    selectedIds().length > 0 ? selectedIds().join(',') : undefined,
  )

  const charities2Url = createMemo(() =>
    buildUrl('/overlays/charities2', {
      header: selectedHeaders(),
      speed: speed(),
      includeTotals: includeTotals2(),
      theme: theme2(),
      headerTheme: headerTheme2(),
      showDesc: showDesc(),
      showQRCode: showQRCode(),
      showUrl: showUrl(),
      causes: causesParam(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <p class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        Show a selected team’s upcoming stream slots in a compact panel. Choose
        a theme, pick filled or striped style, and set the item limit. Set your
        OBS Browser Source to 300x450 px.
      </p>
      <div class="flex flex-row gap-1">
        <div class="flex flex-1 flex-col">
          <FieldRow label="Header Cards">
            <div class="flex w-[30rem] flex-col gap-1">
              <For each={headerOptions as unknown as string[]}>
                {(h) => (
                  <label class="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedHeaders().includes(h)}
                      onChange={(e) => {
                        const set = new Set(selectedHeaders())
                        if (e.currentTarget.checked) set.add(h)
                        else set.delete(h)
                        // Preserve default display order of headerOptions
                        setSelectedHeaders(
                          headerOptions.filter((x) => set.has(x)),
                        )
                      }}
                    />
                    <span>{h}</span>
                  </label>
                )}
              </For>
            </div>
          </FieldRow>
          <FieldRow label="Speed (0.25–3.0)">
            <input
              type="number"
              step="0.05"
              min="0.25"
              max="3"
              value={speed()}
              onInput={(e) => setSpeed(Number(e.currentTarget.value))}
              class="w-24 rounded bg-black/40 px-2 py-1"
            />
          </FieldRow>
          <FieldRow label="Include Totals">
            <input
              type="checkbox"
              checked={includeTotals2()}
              onChange={(e) => setIncludeTotals2(e.currentTarget.checked)}
            />
          </FieldRow>
          <FieldRow label="Theme">
            <select
              class="rounded bg-black/40 px-2 py-1"
              value={theme2()}
              onChange={(e) => setTheme2(e.currentTarget.value as Theme2)}
            >
              <option value="default">default</option>
              <option value="red">red</option>
              <option value="blue">blue</option>
              <option value="carousel">carousel</option>
            </select>
          </FieldRow>
          <FieldRow label="Header Theme">
            <select
              class="rounded bg-black/40 px-2 py-1"
              value={headerTheme2()}
              onChange={(e) =>
                setHeaderTheme2(e.currentTarget.value as HeaderTheme2)
              }
            >
              <option value="default">default</option>
              <option value="red">red</option>
              <option value="blue">blue</option>
            </select>
          </FieldRow>
          <FieldRow label="Show Description">
            <input
              type="checkbox"
              checked={showDesc()}
              onChange={(e) => setShowDesc(e.currentTarget.checked)}
            />
          </FieldRow>
          <FieldRow label="Show QR Code">
            <input
              type="checkbox"
              checked={showQRCode()}
              onChange={(e) => setShowQRCode(e.currentTarget.checked)}
            />
          </FieldRow>
          <FieldRow label="Show URL">
            <input
              type="checkbox"
              checked={showUrl()}
              onChange={(e) => setShowUrl(e.currentTarget.checked)}
            />
          </FieldRow>
          <FieldRow label="Select Charities">
            <div class="flex w-[30rem] flex-col gap-2">
              <div class="max-h-60 w-full overflow-y-auto rounded border border-accent-500/40 bg-black/20 p-2">
                <Show
                  when={!q.isLoading}
                  fallback={<p class="opacity-70">Loading charities…</p>}
                >
                  <For each={charities()}>
                    {(c) => (
                      <label class="flex cursor-pointer items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds().includes(Number(c.id))}
                          onChange={(e) =>
                            toggleOne(Number(c.id), e.currentTarget.checked)
                          }
                        />
                        <span class="line-clamp-1">{c.name}</span>
                      </label>
                    )}
                  </For>
                </Show>
              </div>
              <p class="text-xs opacity-70">
                Tip: Leave all unchecked to include every charity.
              </p>
            </div>
          </FieldRow>
        </div>
        <div class="flex flex-1 flex-col">
          <PreviewFrame
            url={charities2Url()}
            visible={p.visible}
            class={'h-[450px] w-[300px]'}
          />
        </div>
      </div>
      <LinkPreview url={charities2Url()} />
    </div>
  )
}

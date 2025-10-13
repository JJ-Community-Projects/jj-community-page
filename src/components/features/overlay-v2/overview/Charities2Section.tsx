import { type Component, createMemo, createSignal } from 'solid-js'
import { FieldRow, LinkPreview, PreviewFrame, buildUrl } from './Common'

type Theme2 = 'default' | 'red' | 'blue' | 'carousel'
type HeaderTheme2 = 'default' | 'red' | 'blue'

export const Charities2Section: Component<{ visible?: boolean }> = (p) => {
  const [headers, setHeaders] = createSignal<string>('Title, JJLink')
  const [speed, setSpeed] = createSignal<number>(1)
  const [includeTotals2, setIncludeTotals2] = createSignal<boolean>(false)
  const [theme2, setTheme2] = createSignal<Theme2>('default')
  const [headerTheme2, setHeaderTheme2] = createSignal<HeaderTheme2>('default')

  const charities2Url = createMemo(() =>
    buildUrl('/overlays-v2/charities2', {
      header: headers()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      speed: speed(),
      includeTotals: includeTotals2(),
      theme: theme2(),
      headerTheme: headerTheme2(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Headers (comma separated)">
        <input
          value={headers()}
          onInput={(e) => setHeaders(e.currentTarget.value)}
          class="w-80 rounded bg-black/40 px-2 py-1"
        />
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
          onChange={(e) => setHeaderTheme2(e.currentTarget.value as HeaderTheme2)}
        >
          <option value="default">default</option>
          <option value="red">red</option>
          <option value="blue">blue</option>
        </select>
      </FieldRow>
      <LinkPreview url={charities2Url()} />
      <PreviewFrame url={charities2Url()} visible={p.visible} />
    </div>
  )
}

export default Charities2Section

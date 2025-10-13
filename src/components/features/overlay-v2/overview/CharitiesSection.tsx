import { type Component, createMemo, createSignal } from 'solid-js'
import { FieldRow, LinkPreview, PreviewFrame, buildUrl } from './Common'

export const CharitiesSection: Component<{ visible?: boolean }> = (p) => {
  const [includeTotals1, setIncludeTotals1] = createSignal<boolean>(false)
  const [pageSizeC1, setPageSizeC1] = createSignal<number>(30)

  const charitiesUrl = createMemo(() =>
    buildUrl('/overlays-v2/charities', {
      includeTotals: includeTotals1(),
      pageSize: pageSizeC1(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Include Totals">
        <input
          type="checkbox"
          checked={includeTotals1()}
          onChange={(e) => setIncludeTotals1(e.currentTarget.checked)}
        />
      </FieldRow>
      <FieldRow label="Page Size">
        <input
          type="number"
          min="1"
          max="200"
          value={pageSizeC1()}
          onInput={(e) => setPageSizeC1(Number(e.currentTarget.value))}
          class="w-24 rounded bg-black/40 px-2 py-1"
        />
      </FieldRow>
      <LinkPreview url={charitiesUrl()} />
      <PreviewFrame url={charitiesUrl()} visible={p.visible} />
    </div>
  )
}

export default CharitiesSection

import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../../overview/Common.tsx'

type OrderBy = 'recent' | 'top' | 'alphabetical'

export const FundraisersTickerConfigurator: Component<{
  visible?: boolean
}> = (p) => {
  const [orderBy, setOrderBy] = createSignal<OrderBy>('recent')
  const [pageSizeF, setPageSizeF] = createSignal<number>(25)

  const fundraisersUrl = createMemo(() =>
    buildUrl('/overlays-v2/fundraisers', {
      orderBy: orderBy(),
      pageSize: pageSizeF(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <FieldRow label="Order By">
        <select
          class="rounded bg-black/40 px-2 py-1"
          value={orderBy()}
          onChange={(e) => setOrderBy(e.currentTarget.value as OrderBy)}
        >
          <option value="recent">recent</option>
          <option value="top">top</option>
          <option value="alphabetical">alphabetical</option>
        </select>
      </FieldRow>
      <FieldRow label="Page Size">
        <input
          type="number"
          min="1"
          max="200"
          value={pageSizeF()}
          onInput={(e) => setPageSizeF(Number(e.currentTarget.value))}
          class="w-24 rounded bg-black/40 px-2 py-1"
        />
      </FieldRow>
      <LinkPreview url={fundraisersUrl()} />
      <PreviewFrame url={fundraisersUrl()} visible={p.visible} />
    </div>
  )
}

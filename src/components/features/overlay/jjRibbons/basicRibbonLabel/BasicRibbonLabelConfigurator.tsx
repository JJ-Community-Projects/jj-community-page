import { type Component, createMemo, createSignal, Show } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../../overview/Common.tsx'

type Style = 'red' | 'blue' | 'black'
type Alignment = 'left' | 'right' | 'center'

export const BasicRibbonLabelConfigurator: Component<{ visible?: boolean }> = () => {
  const [style, setStyle] = createSignal<Style>('red')
  const [alignment, setAlignment] = createSignal<Alignment>('center')
  const [text, setText] = createSignal<string>('Hello Jingle Jam!')

  const url = createMemo(() =>
    buildUrl('/overlays/basic-ribbon-label', {
      style: style(),
      alignment: alignment(),
      text: text(),
    }),
  )

  const previewUrl = createMemo(() =>
    buildUrl('/overlays/basic-ribbon-label', {
      style: style(),
      alignment: alignment(),
      text: text(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <p class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        Create a simple ribbon label with a selectable color, alignment and text.
        Paste the generated URL into an OBS Browser Source. Adjust browser size to fit.
        Recommended height 100px.
      </p>

      <div class="flex flex-row gap-1">
        <div class="flex flex-1 flex-col gap-4">
          <div class="flex flex-1 flex-col">
            <FieldRow label="Style">
              <select
                class="rounded bg-black/40 px-2 py-1"
                value={style()}
                onChange={(e) => setStyle(e.currentTarget.value as Style)}
              >
                <option value="red">red</option>
                <option value="blue">blue</option>
                <option value="black">black</option>
              </select>
            </FieldRow>

            <FieldRow label="Alignment">
              <select
                class="rounded bg-black/40 px-2 py-1"
                value={alignment()}
                onChange={(e) => setAlignment(e.currentTarget.value as Alignment)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </FieldRow>

            <FieldRow label="Text">
              <input
                class="w-full rounded bg-black/40 px-2 py-1"
                type="text"
                value={text()}
                onInput={(e) => setText(e.currentTarget.value)}
                placeholder="Enter ribbon text"
              />
            </FieldRow>

            <Show when={true}>
              <LinkPreview url={url()} />
            </Show>
          </div>
        </div>
      </div>

      <div class={'max-w-[400px]'}>
        <PreviewFrame url={previewUrl()} visible={true} />
      </div>
    </div>
  )
}

export default BasicRibbonLabelConfigurator

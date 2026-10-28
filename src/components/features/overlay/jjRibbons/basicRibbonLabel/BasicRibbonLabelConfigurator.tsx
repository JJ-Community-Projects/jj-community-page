import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  titleCase,
} from '../../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../../overview/formats.ts'
import { TextField } from '../../../../ui/Form'
import { Select } from '../../../../ui/Select'

type Style = 'red' | 'blue' | 'black'
type Alignment = 'left' | 'right' | 'center'

export const BasicRibbonLabelConfigurator: Component = () => {
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

  return (
    <ConfiguratorBody
      description="A ribbon label with your own text. Set the browser source's width to fit the text."
      format={OVERLAY_FORMATS['basic-ribbon-label']}
      previewUrl={url()}
      linkUrl={url()}
    >
      <TextField
        label="Text"
        value={text()}
        onChange={setText}
        placeholder="Enter ribbon text"
        class="sm:col-span-2"
      />
      <Select
        label="Theme"
        showLabel
        options={['red', 'blue', 'black'] as Style[]}
        value={style()}
        onChange={setStyle}
        format={titleCase}
      />
      <Select
        label="Alignment"
        showLabel
        options={['left', 'center', 'right'] as Alignment[]}
        value={alignment()}
        onChange={setAlignment}
        format={titleCase}
      />
    </ConfiguratorBody>
  )
}

export default BasicRibbonLabelConfigurator

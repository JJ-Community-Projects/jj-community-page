import { type Component, createMemo, createSignal } from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
} from '../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../overview/formats.ts'
import {
  BG_PRESETS,
  BG_PRESET_ORDER,
  type BgPreset,
} from '../donationMatches/presets.ts'
import { createGoalItems, GoalItemsEditor } from '../goals/GoalItemsEditor.tsx'
import {
  OrderSelect,
  ShowCountSelect,
  TitleField,
} from '../goals/GoalOptions.tsx'
import {
  encodeItem,
  type GoalItem,
  type GoalOrder,
  ITEM_PARAM,
  pageCount,
  type ShowCount,
} from '../goals/goalItems.ts'
import { estimateSize } from '../goals/estimateSize.ts'
import { SuggestedSize } from '../goals/SuggestedSize.tsx'
import { Checkbox } from '../../../ui/Form'
import { Select } from '../../../ui/Select'

const EXAMPLES: GoalItem[] = [
  { value: 25, text: 'Cosplay for 1hr' },
  { value: 50, text: 'Wear a funny hat' },
  { value: 100, text: 'Shave something' },
  { value: 250, text: 'Wax arms or legs' },
  { value: 500, text: 'Dye your hair' },
]

export const IncentivesConfigurator: Component = () => {
  const list = createGoalItems('overlay-incentives-items', EXAMPLES)
  const [theme, setTheme] = createSignal<BgPreset>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [order, setOrder] = createSignal<GoalOrder>('asc')
  const [show, setShow] = createSignal<ShowCount>('all')
  const [title, setTitle] = createSignal('Incentives')
  const [itemBg, setItemBg] = createSignal(true)

  const url = createMemo(() =>
    buildUrl('/overlays/incentives', {
      theme: theme(),
      currency: currency(),
      order: order(),
      show: String(show()),
      itemBg: itemBg(),
      title: title(),
      [ITEM_PARAM]: list.items().map(encodeItem),
    }),
  )

  const size = createMemo(() =>
    estimateSize({
      items: list.items(),
      show: show(),
      currency: currency(),
      title: title().trim() !== '',
      itemBg: itemBg(),
      pageDots: pageCount(list.items().length, show()) > 1,
    }),
  )

  return (
    <ConfiguratorBody
      description="A list of your donation incentives. When more are set than are shown at a time, the overlay switches to the next ones every 8 seconds."
      format={{ ...OVERLAY_FORMATS.incentives, preview: size() }}
      previewUrl={url()}
      linkUrl={url()}
    >
      <GoalItemsEditor
        state={list}
        label="Incentives"
        noun="incentive"
        placeholder="What happens at this amount"
      />
      <TitleField value={title()} onChange={setTitle} />
      <Select
        label="Theme"
        showLabel
        options={BG_PRESET_ORDER}
        value={theme()}
        onChange={setTheme}
        format={(preset) => BG_PRESETS[preset].label}
      />
      <CurrencySelect value={currency()} onChange={setCurrency} />
      <ShowCountSelect value={show()} onChange={setShow} />
      <OrderSelect value={order()} onChange={setOrder} />
      <Checkbox
        label="Background behind each incentive"
        checked={itemBg()}
        onChange={setItemBg}
      />
      <SuggestedSize size={size()} />
    </ConfiguratorBody>
  )
}

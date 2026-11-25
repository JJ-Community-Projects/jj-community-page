import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  on,
  Show,
  untrack,
} from 'solid-js'
import {
  buildUrl,
  ConfiguratorBody,
  type Currency,
  CurrencySelect,
  PreviewDataField,
  type PreviewDataMode,
} from '../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../overview/formats.ts'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'
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
  formatAmount,
  type GoalItem,
  type GoalOrder,
  ITEM_PARAM,
  parseAmount,
  type ShowCount,
} from '../goals/goalItems.ts'
import { estimateSize } from '../goals/estimateSize.ts'
import { SuggestedSize } from '../goals/SuggestedSize.tsx'
import { createDemoRaisedSender } from './demoRaised.ts'
import type { BarStyle } from './MilestonesOverlay.tsx'
import { cn } from '../../../ui/cn'
import { Checkbox, fieldClass } from '../../../ui/Form'
import { Select } from '../../../ui/Select'
import { Alert } from '../../../ui/Status'

const EXAMPLES: GoalItem[] = [
  { value: 50, text: 'Do the floss dance' },
  { value: 100, text: 'Add a temporary tattoo' },
  { value: 150, text: 'Add stickers to your face/body' },
  { value: 250, text: 'Do 1 min of hula hooping' },
  { value: 400, text: 'Remove Jenga(Benga?) block from tower' },
  { value: 600, text: 'Draw picture of donor' },
  { value: 1000, text: 'Stick googly eyes on you' },
]

/** Example amount for the preview: halfway between the middle two milestones, so some are reached. */
function exampleRaised(items: GoalItem[]) {
  if (items.length === 0) return 0
  const mid = Math.floor(items.length / 2)
  const below = items[mid - 1]?.value ?? 0
  return (below + items[mid].value) / 2
}

function testMax(items: GoalItem[]) {
  const top = items.at(-1)?.value ?? 0
  return top > 0 ? Math.ceil(top * 1.2) : 100
}

const TestAmountField: Component<{
  value: number
  onChange: (value: number) => void
  max: number
  currency: Currency
}> = (p) => {
  const id = createUniqueId()
  return (
    <div class="flex flex-col gap-1 sm:col-span-2">
      <label for={id} class={fieldClass.label}>
        Test donation amount
      </label>
      <div class="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={Math.max(p.max, p.value)}
          step="1"
          aria-label="Test donation amount slider"
          aria-valuetext={formatAmount(p.value, p.currency)}
          value={p.value}
          onInput={(e) => p.onChange(Number(e.currentTarget.value))}
          class="accent-accent h-10 min-w-0 flex-1 cursor-pointer"
        />
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={p.value}
          onInput={(e) => {
            const value = parseAmount(e.currentTarget.value)
            if (value !== undefined) p.onChange(value)
          }}
          class={cn(fieldClass.input, 'h-10 w-28 shrink-0 tabular-nums')}
        />
      </div>
      <p class={fieldClass.help}>
        Drag to see milestones get reached in the preview.
      </p>
    </div>
  )
}

export const MilestonesConfigurator: Component = () => {
  const { user } = useUser()
  const list = createGoalItems('overlay-milestones-items', EXAMPLES)
  const [theme, setTheme] = createSignal<BgPreset>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [order, setOrder] = createSignal<GoalOrder>('asc')
  const [show, setShow] = createSignal<ShowCount>('all')
  const [bar, setBar] = createSignal(true)
  const [barStyle, setBarStyle] = createSignal<BarStyle>('line')
  const [crossOut, setCrossOut] = createSignal(true)
  const [itemBg, setItemBg] = createSignal(true)
  const [title, setTitle] = createSignal('Milestones')
  const [previewData, setPreviewData] = createSignal<PreviewDataMode>('test')
  const [testRaised, setTestRaised] = createSignal(exampleRaised(list.items()))
  const sendTestRaised = createDemoRaisedSender()
  createEffect(on(testRaised, sendTestRaised, { defer: true }))

  const params = () => ({
    user: user?.tiltifySlug,
    theme: theme(),
    currency: currency(),
    order: order(),
    show: String(show()),
    bar: bar(),
    barStyle: bar() ? barStyle() : undefined,
    crossOut: crossOut(),
    itemBg: itemBg(),
    title: title(),
    [ITEM_PARAM]: list.items().map(encodeItem),
  })
  const url = createMemo(() => buildUrl('/overlays/milestones', params()))
  const size = createMemo(() =>
    estimateSize({
      items: list.items(),
      show: show(),
      currency: currency(),
      title: title().trim() !== '',
      itemBg: itemBg(),
      bar: bar(),
    }),
  )
  // Untracked: a new amount goes to the open preview by message instead of reloading it
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/milestones', {
      ...params(),
      demoRaised: previewData() === 'test' ? untrack(testRaised) : undefined,
    }),
  )

  return (
    <ConfiguratorBody
      description="Your milestones with the reached ones marked, from your Tiltify fundraiser's raised amount; it updates about every 30 seconds."
      format={{ ...OVERLAY_FORMATS.milestones, preview: size() }}
      previewUrl={previewUrl()}
      linkUrl={user?.tiltifySlug ? url() : undefined}
      noLink={
        <Alert tone="info">
          The link needs your Tiltify fundraiser; your account has none.
        </Alert>
      }
    >
      <GoalItemsEditor
        state={list}
        label="Milestones"
        noun="milestone"
        placeholder="What happens at this amount"
      />
      <PreviewDataField
        value={previewData()}
        onChange={setPreviewData}
        help={
          <>
            Example uses the test amount below, only in this preview. Your
            copied OBS link always uses your fundraiser's live amount.
          </>
        }
      />
      <Show when={previewData() === 'test'}>
        <TestAmountField
          value={testRaised()}
          onChange={setTestRaised}
          max={testMax(list.items())}
          currency={currency()}
        />
      </Show>
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
        label="Goal bar next to the list"
        checked={bar()}
        onChange={setBar}
      />
      <Select
        label="Goal bar style"
        showLabel
        options={['line', 'solid'] as BarStyle[]}
        value={barStyle()}
        onChange={setBarStyle}
        format={(v) => (v === 'line' ? 'Line' : 'Solid')}
        disabled={!bar()}
      />
      <Checkbox
        label="Cross out reached milestones"
        checked={crossOut()}
        onChange={setCrossOut}
      />
      <Checkbox
        label="Background behind each milestone"
        checked={itemBg()}
        onChange={setItemBg}
      />
      <SuggestedSize size={size()} />
    </ConfiguratorBody>
  )
}

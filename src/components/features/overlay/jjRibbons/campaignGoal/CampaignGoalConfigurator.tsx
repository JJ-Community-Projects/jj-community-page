import { type Component, createMemo, createSignal, Show } from 'solid-js'
import {
  buildUrl,
  FieldRow,
  LinkPreview,
  PreviewFrame,
} from '../../overview/Common.tsx'
import { useUser } from '../../../users/user-dashboard/providers/UserProvider.tsx'

type Style = 'red' | 'blue' | 'black'
type Currency = 'GBP' | 'USD' | 'EUR'
type Alignment = 'left' | 'right'

export const CampaignGoalConfigurator: Component<{
  visible?: boolean
}> = () => {
  const { user } = useUser()
  const [theme, setTheme] = createSignal<Style>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const [alignment, setAlignment] = createSignal<Alignment>('right')
  const [showChangeLabel, setShowChangeLabel] = createSignal<boolean>(true)


  const url = createMemo(() =>
    buildUrl('/overlays/campaign-goal', {
      user: user?.tiltifySlug,
      theme: theme(),
      currency: currency(),
      alignment: alignment(),
      showChangeLabel: showChangeLabel(),
    }),
  )

  const previewUrl = createMemo(() =>
    buildUrl('/overlays/campaign-goal', {
      debug: true,
      user: user?.tiltifySlug,
      theme: theme(),
      currency: currency(),
      alignment: alignment(),
      showChangeLabel: showChangeLabel(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <p class="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-200">
        This Overlay is still experimental
      </p>
      <p class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        Display your current campaign total and goal with a compact progress
        bar. Pick a color style and paste the generated URL into an OBS Browser
        Source. The overlay will update once
        per minutes. Recommended size around 300x100 but experiment with different widths.
      </p>
      <div class="flex flex-row gap-1">
        <div class="flex flex-1 flex-col gap-4">
          <div class="flex flex-1 flex-col">
            <FieldRow label="Theme">
              <select
                class="rounded bg-black/40 px-2 py-1"
                value={theme()}
                onChange={(e) => setTheme(e.currentTarget.value as Style)}
              >
                <option value="red">red</option>
                <option value="blue">blue</option>
                <option value="black">black</option>
              </select>
            </FieldRow>
            <FieldRow label="Currency">
              <select
                class="rounded bg-black/40 px-2 py-1"
                value={currency()}
                onChange={(e) => setCurrency(e.currentTarget.value as Currency)}
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </FieldRow>
            <FieldRow label="Alignment">
              <select
                class="rounded bg-black/40 px-2 py-1"
                value={alignment()}
                onChange={(e) => setAlignment(e.currentTarget.value as Alignment)}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </FieldRow>
            <FieldRow label="Show raised change">
              <input
                type="checkbox"
                class="h-4 w-4 accent-red-500"
                checked={showChangeLabel()}
                onChange={(e) => setShowChangeLabel(e.currentTarget.checked)}
              />
            </FieldRow>
            <Show when={user?.tiltifySlug}>
              <LinkPreview url={url()} />
            </Show>
          </div>
        </div>
      </div>

      <div class={'max-w-[300px]'}>
        <PreviewFrame url={previewUrl()} visible={true} />
      </div>
    </div>
  )
}

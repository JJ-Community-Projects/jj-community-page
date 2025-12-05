import { type Component, createMemo, createSignal, Show } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame } from '../overview/Common.tsx'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'

type Style = 'red' | 'blue' | 'black'
type Currency = 'GBP' | 'USD' | 'EUR'

export const CampaignGoalConfigurator: Component<{ visible?: boolean }> = () => {
  const [style, setStyle] = createSignal<Style>('red')
  const [currency, setCurrency] = createSignal<Currency>('GBP')
  const { user } = useUser()

  const url = createMemo(() =>
    buildUrl('/overlays/campaign-goal', {
      user: user?.tiltifySlug,
      style: style(),
      currency: currency(),
    }),
  )
  const previewUrl = createMemo(() =>
    buildUrl('/overlays/campaign-goal', {
      user: user?.tiltifySlug,
      style: style(),
      currency: currency(),
      debug: true,
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <p class="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-200">
        This Overlay is still experimental
      </p>
      <p class="mb-2 rounded border border-white/10 bg-white/5 p-2 text-sm text-white/80">
        Display your current campaign total and goal with a compact progress bar.
        Pick a color style and paste the generated URL into an OBS Browser Source
        (recommended size around 300x100).
        The overlay will update once per minutes.
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

import { type Component, createMemo, createSignal } from 'solid-js'
import { buildUrl, FieldRow, LinkPreview, PreviewFrame, } from '../overview/Common.tsx'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'

export const UserScheduleConfigurator: Component<{ visible?: boolean }> = (
  p,
) => {
  const [theme, setTheme] = createSignal<'default' | 'red' | 'blue'>('default')
  const [streamStyle, setStreamStyle] = createSignal<'filled' | 'stripe'>(
    'filled',
  )
  const [limit, setLimit] = createSignal<number>(4)
  const { user } = useUser()
  const scheduleUrl = createMemo(() =>
    buildUrl('/overlays-v2/schedule', {
      user: user.tiltifyName,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: theme(),
      style: streamStyle(),
      limit: limit(),
    }),
  )

  return (
    <div class="flex flex-col gap-2 rounded bg-black/30 p-3">
      <div class={'flex flex-row gap-1'}>
        <div class={'flex flex-1 flex-col gap-2'}>
          <FieldRow label="Theme">
            <select
              value={theme()}
              onChange={(e) => setTheme(e.currentTarget.value as any)}
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="default">Default</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
            </select>
          </FieldRow>
          <FieldRow label="Stream Style">
            <select
              value={streamStyle()}
              onChange={(e) =>
                setStreamStyle(e.currentTarget.value as 'filled' | 'stripe')
              }
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="filled">Filled</option>
              <option value="stripe">Stripe</option>
            </select>
          </FieldRow>
          <FieldRow label="Limit">
            <select
              value={String(limit())}
              onChange={(e) => {
                const v = Math.floor(Number(e.currentTarget.value))
                if (Number.isFinite(v)) setLimit(Math.max(1, Math.min(100, v)))
              }}
              class="w-40 rounded bg-black/40 px-2 py-1"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </FieldRow>
        </div>
        <div class={'flex flex-1 flex-col gap-2'}>
          <PreviewFrame url={scheduleUrl()} visible={p.visible} />
        </div>
      </div>
      <LinkPreview url={scheduleUrl()} />
    </div>
  )
}

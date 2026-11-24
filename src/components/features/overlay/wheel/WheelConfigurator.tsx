import { type Component, createMemo, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { buildUrl, ConfiguratorBody } from '../overview/Common.tsx'
import { OVERLAY_FORMATS } from '../overview/formats.ts'
import { useUser } from '../../users/user-dashboard/providers/UserProvider.tsx'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { Select } from '../../../ui/Select'
import { Alert } from '../../../ui/Status'
import { createWheelItems, WheelItemsEditor } from './WheelItemsEditor.tsx'
import {
  WHEEL_ITEM_PARAM,
  WHEEL_MIN_ITEMS,
  WHEEL_THEME_ORDER,
  WHEEL_THEMES,
  type WheelTheme,
} from './wheel.ts'

const EXAMPLES = [
  'Sing a carol',
  'Christmas jumper on',
  'Chat picks the game',
  'Mince pie taste test',
  'Speak in an accent',
  'Spin again',
  '10 push-ups',
  'Drink some water',
]

const DASHBOARD_PAGE = '/dashboard/wheel'

export const WheelConfigurator: Component = () => {
  const { user } = useUser()
  const list = createWheelItems('overlay-wheel-items', EXAMPLES)
  const [theme, setTheme] = createSignal<WheelTheme>('red')

  const link = useQuery(() =>
    orpcPrivate.wheelWS.overlayKey.queryOptions({
      enabled: !!user,
      staleTime: Infinity,
    }),
  )

  const params = () => ({
    theme: theme(),
    [WHEEL_ITEM_PARAM]: list.items(),
  })
  // The preview spins on click only: without the key it doesn't count as one of your overlays
  const previewUrl = createMemo(() => buildUrl('/overlays/wheel', params()))
  const url = createMemo(() => {
    const data = link.data
    if (!data || list.items().length < WHEEL_MIN_ITEMS) return undefined
    return buildUrl('/overlays/wheel', {
      ...params(),
      user: String(data.userId),
      key: data.key,
    })
  })

  return (
    <ConfiguratorBody
      description={
        <>
          A chance wheel with your own items. Add the link to OBS, then spin it from{' '}
          <a href={DASHBOARD_PAGE} class="text-fg underline">
            your dashboard's wheel page
          </a>
          : every OBS source with your link spins at the same time and lands on the same item.
        </>
      }
      format={OVERLAY_FORMATS.wheel}
      previewUrl={previewUrl()}
      linkUrl={url()}
      noLink={
        list.items().length < WHEEL_MIN_ITEMS ? (
          <Alert tone="info">Add at least {WHEEL_MIN_ITEMS} items to get the link.</Alert>
        ) : link.isError ? (
          <Alert tone="danger">Your wheel link couldn't be loaded. Reload the page to try again.</Alert>
        ) : undefined
      }
    >
      <WheelItemsEditor state={list} />
      <Select
        label="Colours"
        showLabel
        options={WHEEL_THEME_ORDER}
        value={theme()}
        onChange={setTheme}
        format={(t) => WHEEL_THEMES[t].label}
      />
      <p class="text-fg-muted self-end text-sm sm:col-span-2">
        Click the preview to try a spin. The link contains a key for your account: like your other
        OBS links, keep it to yourself.
      </p>
    </ConfiguratorBody>
  )
}

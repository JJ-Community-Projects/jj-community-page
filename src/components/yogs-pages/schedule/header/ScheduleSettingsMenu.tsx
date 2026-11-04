import { type Component, createSignal, For, onMount } from 'solid-js'
import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { FaSolidCheck, FaSolidGear } from 'solid-icons/fa'
import { cn, focusRing } from '../../../ui/cn'

/**
 * Desktop grid settings. A setting that is off is stored as 'off' under its key and mirrored to
 * `data-<key>="off"` on <html>, where yogs-schedule.css hides the part. The inline script in
 * Head.astro applies the same keys before the first paint.
 */
const settings = [
  { key: 'yogs-bg', label: 'Show background' },
  { key: 'yogs-motion', label: 'Animate background' },
  { key: 'yogs-avatars', label: 'Show avatars' },
] as const

type SettingKey = (typeof settings)[number]['key']

const isOn = (key: SettingKey) => {
  try {
    return localStorage.getItem(key) !== 'off'
  } catch {
    return true
  }
}

const apply = (key: SettingKey, on: boolean) => {
  if (on) document.documentElement.removeAttribute(`data-${key}`)
  else document.documentElement.setAttribute(`data-${key}`, 'off')
}

/** Square gear button in the grid's header row, with a menu of the grid settings. */
export const ScheduleSettingsMenu: Component<{ class?: string }> = (props) => {
  const [state, setState] = createSignal<Record<SettingKey, boolean>>({
    'yogs-bg': true,
    'yogs-motion': true,
    'yogs-avatars': true,
  })

  // Read after mount (the server knows no storage); also covers pages without Head.astro (embed)
  onMount(() => {
    const stored = {
      'yogs-bg': isOn('yogs-bg'),
      'yogs-motion': isOn('yogs-motion'),
      'yogs-avatars': isOn('yogs-avatars'),
    }
    setState(stored)
    for (const { key } of settings) apply(key, stored[key])
  })

  const toggle = (key: SettingKey, on: boolean) => {
    setState((s) => ({ ...s, [key]: on }))
    apply(key, on)
    try {
      if (on) localStorage.removeItem(key)
      else localStorage.setItem(key, 'off')
    } catch {
      // Storage blocked: the choice holds until the next page load
    }
  }

  return (
    <DropdownMenu placement="bottom-start" gutter={4}>
      <DropdownMenu.Trigger
        aria-label="Schedule settings"
        title="Schedule settings"
        class={cn(
          'rounded-tile text-fg shadow-tile hover:bg-surface dark:bg-surface-strong flex cursor-pointer items-center justify-center bg-white transition-colors',
          focusRing,
          props.class,
        )}
      >
        <FaSolidGear class="size-(--yogs-rem)" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="rounded-group bg-surface-strong shadow-tile-hover ring-line z-50 min-w-44 p-1 font-sans ring-1 outline-none">
          <For each={settings}>
            {(setting) => (
              <DropdownMenu.CheckboxItem
                checked={state()[setting.key]}
                onChange={(on) => toggle(setting.key, on)}
                // Without the background there is nothing to animate
                disabled={setting.key === 'yogs-motion' && !state()['yogs-bg']}
                closeOnSelect={false}
                class="text-fg rounded-media data-highlighted:bg-tint flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm outline-none data-disabled:cursor-default data-disabled:opacity-50"
              >
                <DropdownMenu.ItemLabel class="flex-1">
                  {setting.label}
                </DropdownMenu.ItemLabel>
                <DropdownMenu.ItemIndicator>
                  <FaSolidCheck class="text-accent size-3" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>
            )}
          </For>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  )
}

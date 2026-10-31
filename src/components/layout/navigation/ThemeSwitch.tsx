import { type Component, For, createSignal, onMount } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import {
  FaSolidCheck,
  FaSolidDesktop,
  FaSolidMoon,
  FaSolidSun,
} from 'solid-icons/fa'
import { Segmented } from '../../ui/Form'
import { cn, focusRing } from '../../ui/cn'

type Theme = 'light' | 'dark' | 'system'

// Same key and rule as the inline script in Head.astro, which applies the theme before the first paint
const STORAGE_KEY = 'theme'

const themes = [
  { value: 'light', label: 'Light', icon: FaSolidSun },
  { value: 'dark', label: 'Dark', icon: FaSolidMoon },
  { value: 'system', label: 'System', icon: FaSolidDesktop },
] as const

// One signal for the desktop menu and the mobile sheet, so both show the same choice
const [theme, setThemeSignal] = createSignal<Theme>('system')

const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

const setTheme = (next: Theme) => {
  setThemeSignal(next)
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage blocked: the choice holds until the next page load
  }
  const dark =
    next === 'dark' ||
    (next === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Round icon button on the red canvas with a Light / Dark / System menu (desktop nav). */
export const ThemeMenu: Component = () => {
  onMount(() => setThemeSignal(readTheme()))
  const current = () => themes.find((t) => t.value === theme()) ?? themes[2]
  return (
    <DropdownMenu placement="bottom-end" gutter={4}>
      <DropdownMenu.Trigger
        aria-label={`Theme: ${current().label}`}
        class={cn(
          'text-on-canvas-muted hover:text-on-canvas flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10',
          focusRing,
        )}
      >
        <Dynamic
          component={current().icon}
          class="size-3.5"
          aria-hidden="true"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="rounded-group bg-surface-strong shadow-tile-hover ring-line z-50 min-w-36 p-1 ring-1 outline-none">
          <DropdownMenu.RadioGroup
            value={theme()}
            onChange={(value) => setTheme(value as Theme)}
          >
            <For each={themes}>
              {(option) => (
                <DropdownMenu.RadioItem
                  value={option.value}
                  class="text-fg rounded-media data-highlighted:bg-tint flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm outline-none"
                >
                  <Dynamic
                    component={option.icon}
                    class="text-fg-muted size-3.5"
                    aria-hidden="true"
                  />
                  <DropdownMenu.ItemLabel class="flex-1">
                    {option.label}
                  </DropdownMenu.ItemLabel>
                  <DropdownMenu.ItemIndicator>
                    <FaSolidCheck
                      class="text-accent size-3"
                      aria-hidden="true"
                    />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              )}
            </For>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  )
}

/** Light / Dark / System pills for the mobile menu sheet. */
export const ThemeSegmented: Component = () => {
  onMount(() => setThemeSignal(readTheme()))
  return (
    <Segmented
      label="Theme"
      size="sm"
      value={theme()}
      onChange={(value) => setTheme(value as Theme)}
      options={themes.map((option) => ({
        value: option.value,
        label: option.label,
        icon: (
          <Dynamic component={option.icon} class="size-3" aria-hidden="true" />
        ),
      }))}
    />
  )
}

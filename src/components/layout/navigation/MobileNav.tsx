import { type Component, For, Show } from 'solid-js'
import { Dialog as KDialog } from '@kobalte/core/dialog'
import { FaSolidBars, FaSolidXmark } from 'solid-icons/fa'
import { IconButton } from '../../ui/Button'
import { cn, focusRing } from '../../ui/cn'
import { DonateIcon } from '../../common/icons/JJIcons'
import { type NavItem, isActive } from './navItems'
import { ThemeSegmented } from './ThemeSwitch'

type MobileNavProps = {
  items: NavItem[]
  /** href of the current page, from `currentHref`. */
  current?: string
}

const rowClass = (active: boolean) =>
  cn(
    'flex items-center gap-2 rounded-group px-3 py-2 text-sm font-medium',
    focusRing,
    active
      ? 'bg-surface-strong text-primary-text ring-1 ring-line'
      : 'text-fg hover:bg-tint',
  )

/** The menu button and sheet below `md`; the desktop nav lives in SiteHeader.astro. */
export const MobileNav: Component<MobileNavProps> = (props) => (
  <KDialog>
    <KDialog.Trigger
      as={IconButton}
      variant="canvas"
      aria-label="Menu"
      class="md:hidden"
    >
      <FaSolidBars class="size-4" aria-hidden="true" />
    </KDialog.Trigger>
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-black/50 md:hidden" />
      <KDialog.Content class="rounded-tile bg-surface text-fg shadow-tile-hover fixed inset-x-2 top-2 z-50 max-h-[calc(100dvh-1rem)] overflow-y-auto p-2 md:hidden">
        <div class="flex items-center justify-between gap-2 pb-1 pl-3">
          <KDialog.Title class="text-fg-muted text-xs font-semibold tracking-wide uppercase">
            Menu
          </KDialog.Title>
          <KDialog.CloseButton
            as={IconButton}
            variant="ghost"
            size="sm"
            aria-label="Close menu"
          >
            <FaSolidXmark class="size-4" aria-hidden="true" />
          </KDialog.CloseButton>
        </div>
        <nav aria-label="Main">
          <ul class="flex flex-col gap-0.5">
            <For each={props.items}>
              {(item) => (
                <li>
                  <Show
                    when={item.children}
                    fallback={
                      <a
                        href={item.href}
                        class={rowClass(item.href === props.current)}
                        aria-current={
                          item.href === props.current ? 'page' : undefined
                        }
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener' : undefined}
                      >
                        {item.label}
                        <Show when={item.external}>
                          <DonateIcon class="text-primary-text size-4" />
                        </Show>
                      </a>
                    }
                  >
                    {(children) => (
                      <div
                        class={cn(
                          'rounded-group py-1',
                          isActive(item, props.current) && 'bg-tint',
                        )}
                      >
                        <p class="text-fg-muted px-3 pt-1 pb-0.5 text-xs font-semibold">
                          {item.label}
                        </p>
                        <ul class="flex flex-wrap gap-1 px-2">
                          <For each={children()}>
                            {(child) => (
                              <li>
                                <a
                                  href={child.href}
                                  class={cn(
                                    'block rounded-full px-3 py-1 text-sm',
                                    focusRing,
                                    child.href === props.current
                                      ? 'bg-accent text-white'
                                      : 'bg-surface-strong ring-line text-fg hover:bg-surface-2 ring-1',
                                  )}
                                  aria-current={
                                    child.href === props.current
                                      ? 'page'
                                      : undefined
                                  }
                                >
                                  {child.label}
                                </a>
                              </li>
                            )}
                          </For>
                        </ul>
                      </div>
                    )}
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </nav>
        <div class="border-line mt-1 flex items-center justify-between gap-2 border-t px-3 pt-2 pb-1">
          <p class="text-fg-muted text-xs font-semibold">Theme</p>
          <ThemeSegmented />
        </div>
      </KDialog.Content>
    </KDialog.Portal>
  </KDialog>
)

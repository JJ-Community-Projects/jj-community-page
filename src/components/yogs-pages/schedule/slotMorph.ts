import { type SwitchTransition, transitionsOff } from './crossfade.ts'

/**
 * Week switch as a view transition: each tile morphs into the one at the same column and start row.
 * Names are set only while it runs; without view transitions or with reduced motion: `fallback`.
 */
export const createSlotMorph = (
  el: () => HTMLElement | undefined,
  fallback: SwitchTransition,
): SwitchTransition => {
  // Only the latest transition clears the names
  let latest = 0

  const set = (el: Element | null, name: string, cls: string, on: boolean) => {
    if (!(el instanceof HTMLElement)) return
    el.style.viewTransitionName = on ? name : ''
    el.style.setProperty('view-transition-class', on ? cls : '')
  }

  // Named by column and offset (same start row, same offset). The text gets its own name to move
  // unscaled; its class carries the tile's dimming, which it loses when captured alone. Avatars and
  // VOD icons stay in the tile's snapshot: every named part is restyled on each frame.
  const name = (body: HTMLElement, on: boolean) => {
    body.querySelectorAll<HTMLElement>('.day-container').forEach((column, c) => {
      for (const tile of column.querySelectorAll<HTMLElement>('.yogs-tile-cell > button')) {
        const key = `yogs-slot-${c}-${Math.round(tile.offsetTop)}`
        const part = tile.classList.contains('opacity-40')
          ? 'yogs-slot-part yogs-slot-dimmed'
          : tile.classList.contains('opacity-80')
            ? 'yogs-slot-part yogs-slot-ended'
            : 'yogs-slot-part'
        set(tile, key, 'yogs-slot', on)
        set(tile.querySelector('[data-slot-text]'), `${key}-text`, `${part} yogs-slot-fade`, on)
      }
    })
  }

  return (update) => {
    if (transitionsOff()) return update()
    const body = el()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!body || reduce || !('startViewTransition' in document)) return fallback(update)

    const id = ++latest
    const root = document.documentElement
    // The pseudo-elements inherit from <html>, not the grid
    const tile = body.querySelector<HTMLElement>('.yogs-tile-cell > button')
    if (tile) root.style.setProperty('--yogs-slot-radius', getComputedStyle(tile).borderRadius)

    name(body, true)
    const transition = document.startViewTransition(() => {
      update()
      name(body, true)
    })
    void transition.finished.finally(() => {
      if (id !== latest) return
      name(body, false)
      root.style.removeProperty('--yogs-slot-radius')
    })
  }
}

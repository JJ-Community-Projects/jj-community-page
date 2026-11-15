import type { YogsScheduleWeek } from '../../../lib/orpc/private/yogs/contract.ts'
import { type SwitchTransition, transitionsOff } from './crossfade.ts'

interface Slot {
  tile: HTMLElement
  text: HTMLElement | null
  vods: HTMLElement | null
  /** Day column and start row. */
  key: string
  /** Not a `steady` slot: the text and the VOD icons get names of their own. */
  split: boolean
  width: number
  height: number
  /** Centre of the text, from the tile's top. */
  textCentre: number
  /** How the tile is dimmed, if it is. */
  dimming: '' | 'dimmed' | 'ended'
}

/** A named part that starts at `from` (a transform) and moves to its place. */
interface Move {
  name: string
  from: string
}

const DURATION_MS = 300
const EASING = 'cubic-bezier(0.23, 1, 0.32, 1)'

/** The slots ("column-row-size") that hold a tile of that size in every week. */
export const steadySlots = (weeks: YogsScheduleWeek[]) => {
  const count = new Map<string, number>()
  for (const week of weeks) {
    week.days.forEach((day, column) => {
      let row = 0
      for (const { size } of day.streams) {
        const slot = `${column}-${row}-${size}`
        count.set(slot, (count.get(slot) ?? 0) + 1)
        row += size
      }
    })
  }
  return new Set([...count].filter(([, weeksWith]) => weeksWith === weeks.length).map(([slot]) => slot))
}

/**
 * Week switch as a view transition: each tile morphs into the one at the same column and start row.
 * Names are set only while it runs; without view transitions or with reduced motion: `fallback`.
 */
export const createSlotMorph = (
  el: () => HTMLElement | undefined,
  fallback: SwitchTransition,
  steady: Set<string>,
): SwitchTransition => {
  // Only the latest transition clears the names
  let latest = 0

  // Reads only, all before the names are written: taking turns would recalculate styles for every tile
  const measure = (body: HTMLElement, unit: number) => {
    const slots: Slot[] = []
    body.querySelectorAll<HTMLElement>('.day-container').forEach((column, c) => {
      let row = 0
      for (const cell of column.querySelectorAll<HTMLElement>('.yogs-tile-cell')) {
        const slot = `${c}-${row}`
        const size = Math.round(cell.offsetHeight / unit)
        row += size
        const tile = cell.querySelector<HTMLElement>(':scope > button')
        if (!tile) continue
        const text = tile.querySelector<HTMLElement>('[data-slot-text]')
        const vods = tile.querySelector<HTMLElement>('.yogs-vods')
        const split = !steady.has(`${slot}-${size}`)
        const box = tile.getBoundingClientRect()
        const textBox = split ? text?.getBoundingClientRect() : undefined
        slots.push({
          tile,
          text,
          vods,
          key: `yogs-slot-${slot}`,
          split,
          width: box.width,
          height: box.height,
          textCentre: textBox ? textBox.top + textBox.height / 2 - box.top : 0,
          dimming: tile.classList.contains('opacity-40')
            ? 'dimmed'
            : tile.classList.contains('opacity-80')
              ? 'ended'
              : '',
        })
      }
    })
    return slots
  }

  const set = (el: HTMLElement, name: string, classes: (string | false)[]) => {
    el.style.viewTransitionName = name
    el.style.setProperty('view-transition-class', classes.filter(Boolean).join(' '))
  }

  // Each name is one more snapshot, so there are as few as it takes. Where the tile stretches, comes
  // or goes (not a steady slot), the text and the VOD icons get their own: they move unscaled and fade
  // evenly. Their classes carry the old and the new tile's dimming, which they lose when captured
  // alone. Everything else stays in the tile's snapshot (avatars always).
  //
  // The groups sit at their new place and size: the browser's own animation is off (yogs-schedule.css),
  // as it animates width and height, on the main thread. Returned are the moves of the parts that
  // differ from `before`: a tile that changes size starts scaled to its old one, its text at its old
  // centre. Transforms run off the main thread.
  const name = (slots: Slot[], before?: Map<string, Slot>) => {
    const moves: Move[] = []
    for (const slot of slots) {
      const { tile, text, vods, key, split, width, height } = slot
      // Before the switch, a slot is its own old state
      const was = before ? before.get(key) : slot
      const x = was ? was.width / width : 1
      const y = was ? was.height / height : 1
      const resized = Math.abs(x - 1) * width > 0.5 || Math.abs(y - 1) * height > 0.5
      set(tile, key, [
        'yogs-slot',
        !split && 'yogs-slot-whole',
        // Scaled up, the old tile is larger than its group
        resized && (x > 1 || y > 1) && 'yogs-slot-unclipped',
      ])
      if (resized) moves.push({ name: key, from: `scale(${x}, ${y})` })
      const dimming = [
        !!slot.dimming && `yogs-slot-${slot.dimming}`,
        !!was?.dimming && `yogs-slot-was-${was.dimming}`,
      ]
      // In the tile's top right corner, which stays put (same column, same start row): no move
      if (vods) set(vods, split ? `${key}-vods` : '', split ? ['yogs-slot-text', ...dimming] : [])
      if (!text) continue
      // Tiles are reused by position in their column: an old name must not stay
      if (!split) {
        set(text, '', [])
        continue
      }
      set(text, `${key}-text`, ['yogs-slot-text', ...dimming])
      const shift = was?.split ? was.textCentre - slot.textCentre : 0
      if (Math.abs(shift) > 0.5) moves.push({ name: `${key}-text`, from: `translateY(${shift}px)` })
    }
    return moves
  }

  // The old and the new snapshot of a part move alike, inside their group. Each on its own: on the
  // pair of them, Firefox applies an animation only after the first frame
  const play = (moves: Move[]) => {
    for (const { name, from } of moves) {
      for (const snapshot of ['old', 'new']) {
        document.documentElement.animate(
          { transform: [from, 'none'] },
          { pseudoElement: `::view-transition-${snapshot}(${name})`, duration: DURATION_MS, easing: EASING },
        )
      }
    }
  }

  const clear = (body: HTMLElement) => {
    for (const part of body.querySelectorAll<HTMLElement>('.yogs-tile-cell > button, [data-slot-text], .yogs-vods')) {
      set(part, '', [])
    }
  }

  return (update) => {
    if (transitionsOff()) return update()
    const body = el()
    const tile = body?.querySelector<HTMLElement>('.yogs-tile-cell > button')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!body || !tile || reduce || !('startViewTransition' in document)) return fallback(update)
    const style = getComputedStyle(tile)
    // The grid's row height in px (a registered length, yogs-schedule.css)
    const unit = parseFloat(style.getPropertyValue('--yogs-unit'))
    if (!(unit > 0)) return fallback(update)

    const id = ++latest
    const root = document.documentElement
    const radius = style.borderRadius
    const old = measure(body, unit)
    let moves: Move[] = []

    // The pseudo-elements inherit from <html>, not the grid
    root.style.setProperty('--yogs-slot-radius', radius)
    // The rest of the page shows its new state at once (global.css), so it needs no snapshot
    root.style.viewTransitionName = 'none'
    name(old)
    const before = new Map(old.map((slot) => [slot.key, slot]))
    const transition = document.startViewTransition(() => {
      update()
      moves = name(measure(body, unit), before)
    })
    // The snapshots exist from here on; rejects when the transition is skipped
    void transition.ready.then(
      () => play(moves),
      () => {},
    )
    void transition.finished.finally(() => {
      if (id !== latest) return
      clear(body)
      root.style.viewTransitionName = ''
      root.style.removeProperty('--yogs-slot-radius')
    })
  }
}

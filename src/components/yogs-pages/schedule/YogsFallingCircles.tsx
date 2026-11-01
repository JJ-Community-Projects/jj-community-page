import { type Component, For, onCleanup, onMount } from 'solid-js'

/** Seeded PRNG (mulberry32): the server and the hydrating client draw the same circles. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = rng(2026)
const between = (lo: number, hi: number) =>
  Math.round((lo + rand() * (hi - lo)) * 100) / 100

// Each circle: where it starts across the panel, its size, how long one fall takes, how far into
// that fall it starts (so the panel is already full on load), its sideways drift and its opacity
const CIRCLES = Array.from({ length: 26 }, () => ({
  x: between(0, 100),
  size: between(8, 46),
  duration: between(14, 34),
  delay: between(0, 34),
  drift: between(-40, 40),
  opacity: between(0.12, 0.3),
}))

/** Faint soft circles falling behind the schedule tiles (yogs-schedule.css). Decoration only. */
export const YogsFallingCircles: Component = () => {
  let layer!: HTMLDivElement

  // While the panel is scrolled out of view, `data-offscreen` on it pauses its decoration (the
  // circles and the corner tints); the browser already pauses hidden tabs
  onMount(() => {
    const grid = layer.parentElement
    if (!grid) return
    const observer = new IntersectionObserver(([entry]) =>
      grid.toggleAttribute('data-offscreen', !entry.isIntersecting),
    )
    observer.observe(grid)
    onCleanup(() => observer.disconnect())
  })

  return (
    <div ref={layer} class="yogs-circles" aria-hidden="true">
      <For each={CIRCLES}>
        {(c) => (
          <span
            style={{
              '--x': `${c.x}%`,
              '--size': `${c.size}px`,
              '--duration': `${c.duration}s`,
              '--delay': `-${c.delay}s`,
              '--drift': `${c.drift}px`,
              '--opacity': c.opacity,
            }}
          />
        )}
      </For>
    </div>
  )
}

import { onCleanup } from 'solid-js'

/** Wraps a week / day switch (`update`) in a crossfade. */
export type Crossfade = (update: () => void) => void

const DURATION_MS = 250

interface CrossfadeOptions {
  /** Hidden in the old copy (stays put). */
  keep?: string
  /** Parts that crossfade, also inside `keep`; default: the whole element. */
  fade?: string
}

/**
 * A frozen copy of the old content fades out on top while the new fades in. The element's parent
 * must be a `relative` wrapper around just the element.
 */
export const useCrossfade = (
  el: () => HTMLElement | undefined,
  register: (crossfade?: Crossfade) => void,
  options: CrossfadeOptions = {},
) => {
  let running: Animation[] = []
  let ghost: HTMLElement | undefined

  const finish = () => {
    for (const animation of running) animation.cancel()
    running = []
    ghost?.remove()
    ghost = undefined
  }

  const crossfade: Crossfade = (update) => {
    finish()
    const target = el()
    const wrapper = target?.parentElement
    if (!target || !wrapper) return update()

    const copy = target.cloneNode(true) as HTMLElement
    copy.inert = true
    copy.setAttribute('aria-hidden', 'true')
    Object.assign(copy.style, {
      position: 'absolute',
      top: `${target.offsetTop}px`,
      left: `${target.offsetLeft}px`,
      width: `${target.offsetWidth}px`,
      pointerEvents: 'none',
    })
    if (options.keep) {
      for (const part of copy.querySelectorAll<HTMLElement>(options.keep)) {
        part.style.visibility = 'hidden'
      }
      // Visible children of a hidden parent (the header's date) still fade out
      if (options.fade) {
        for (const part of copy.querySelectorAll<HTMLElement>(options.fade)) {
          part.style.visibility = 'visible'
        }
      }
    }
    wrapper.appendChild(copy)
    ghost = copy

    update()

    const timing = { duration: DURATION_MS, easing: 'ease' }
    const fading = options.fade
      ? [...target.querySelectorAll<HTMLElement>(options.fade)]
      : [target]
    const out = copy.animate([{ opacity: 1 }, { opacity: 0 }], timing)
    running = [
      out,
      ...fading.map((part) => part.animate([{ opacity: 0 }, { opacity: 1 }], timing)),
    ]
    void out.finished.then(finish, () => {})
  }

  register(crossfade)
  onCleanup(() => {
    register(undefined)
    finish()
  })
}

import { onCleanup } from 'solid-js'

/** Wraps a week / day switch (`update`) in an animation. */
export type SwitchTransition = (update: () => void) => void

/** "Animate week switch" is off (ScheduleSettingsMenu). */
export const transitionsOff = () =>
  document.documentElement.dataset.yogsTransitions === 'off'

/** Registers `transition` with the provider while the component lives. */
export const useSwitchTransition = (
  register: (transition?: SwitchTransition) => void,
  transition: SwitchTransition,
) => {
  register(transition)
  onCleanup(() => register(undefined))
}

const DURATION_MS = 250

interface CrossfadeOptions {
  /** Hidden in the old copy (stays put). */
  keep?: string
  /** Parts that crossfade, also inside `keep`; default: the whole element. */
  fade?: string
}

/** A frozen copy of the old content fades out over the new. The parent must be a `relative` wrapper. */
export const createCrossfade = (
  el: () => HTMLElement | undefined,
  options: CrossfadeOptions = {},
): SwitchTransition => {
  let running: Animation[] = []
  let ghost: HTMLElement | undefined

  const finish = () => {
    for (const animation of running) animation.cancel()
    running = []
    ghost?.remove()
    ghost = undefined
  }

  const crossfade: SwitchTransition = (update) => {
    finish()
    const target = el()
    const wrapper = target?.parentElement
    if (!target || !wrapper || transitionsOff()) return update()

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
      // Children can be visible inside a hidden parent
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

  onCleanup(finish)
  return crossfade
}

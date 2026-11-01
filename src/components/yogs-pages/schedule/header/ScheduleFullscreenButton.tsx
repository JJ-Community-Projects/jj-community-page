import {
  type Component,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { FaSolidCompress, FaSolidExpand } from 'solid-icons/fa'
import { IconButton } from '../../../ui/Button'

const IDLE_MS = 4_000

/**
 * Grows the desktop grid to fill the screen: `data-fullscreen` on the grid lets yogs-schedule.css
 * cover the viewport with it, and the page (not the grid) goes full screen, so the dialogs and
 * menus, which portal to <body>, still show above it. Leaving the browser's full screen (Esc)
 * shrinks the grid again. After IDLE_MS without the mouse moving, `data-idle` on the grid fades
 * the header row out (yogs-schedule.css); moving the mouse brings it back.
 */
export const ScheduleFullscreenButton: Component<{ class?: string }> = (
  props,
) => {
  const [active, setActive] = createSignal(false)
  let button!: HTMLButtonElement
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  const grid = () => button.closest('.yogs-grid')

  const setIdle = (on: boolean) => grid()?.toggleAttribute('data-idle', on)

  // Shows the header row again and restarts the countdown to hiding it
  const wake = () => {
    setIdle(false)
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => setIdle(true), IDLE_MS)
  }

  const setGrid = (on: boolean) => {
    grid()?.toggleAttribute('data-fullscreen', on)
    setActive(on)
    if (on) {
      wake()
    } else {
      clearTimeout(idleTimer)
      setIdle(false)
    }
  }

  onMount(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setGrid(false)
    }
    // Only a real move counts: browsers may send a mousemove when the content shifts under a
    // resting cursor, which would bring the header row straight back.
    let lastX = -1
    let lastY = -1
    const onMove = (e: MouseEvent) => {
      if (e.screenX === lastX && e.screenY === lastY) return
      lastX = e.screenX
      lastY = e.screenY
      if (active()) wake()
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('mousemove', onMove)
    onCleanup(() => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('mousemove', onMove)
      clearTimeout(idleTimer)
    })
  })

  const toggle = () => {
    if (active()) {
      setGrid(false)
      if (document.fullscreenElement) void document.exitFullscreen()
    } else {
      setGrid(true)
      // Without the Fullscreen API the grid still covers the window
      document.documentElement.requestFullscreen?.().catch(() => {})
    }
  }

  const label = () => (active() ? 'Exit full screen' : 'Full screen')

  return (
    <IconButton
      ref={button}
      variant="canvas"
      aria-label={label()}
      aria-pressed={active()}
      title={label()}
      class={props.class}
      onClick={toggle}
    >
      <Show when={active()} fallback={<FaSolidExpand class="size-4" />}>
        <FaSolidCompress class="size-4" />
      </Show>
    </IconButton>
  )
}

import {
  type Component,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { FaSolidCompress, FaSolidExpand } from 'solid-icons/fa'
import { IconButton } from '../../../ui/Button'

/**
 * Grows the desktop grid to fill the screen: `data-fullscreen` on the grid lets yogs-schedule.css
 * cover the viewport with it, and the page (not the grid) goes full screen, so the dialogs and
 * menus, which portal to <body>, still show above it. Leaving the browser's full screen (Esc)
 * shrinks the grid again.
 */
export const ScheduleFullscreenButton: Component<{ class?: string }> = (
  props,
) => {
  const [active, setActive] = createSignal(false)
  let button!: HTMLButtonElement

  const setGrid = (on: boolean) => {
    button.closest('.yogs-grid')?.toggleAttribute('data-fullscreen', on)
    setActive(on)
  }

  onMount(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setGrid(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    onCleanup(() => document.removeEventListener('fullscreenchange', onChange))
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

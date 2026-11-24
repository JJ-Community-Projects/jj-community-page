import { type Component, createEffect, createMemo, For, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { FaSolidPlus, FaSolidTrash } from 'solid-icons/fa'
import { Button, IconButton } from '../../../ui/Button'
import { cn } from '../../../ui/cn'
import { fieldClass } from '../../../ui/Form'
import { parseWheelItems, WHEEL_MAX_ITEMS, WHEEL_MAX_TEXT, WHEEL_MIN_ITEMS } from './wheel.ts'

function loadRows(storageKey: string): string[] | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!Array.isArray(saved)) return undefined
    return saved.filter((r) => typeof r === 'string').slice(0, WHEEL_MAX_ITEMS)
  } catch {
    return undefined
  }
}

export function createWheelItems(storageKey: string, examples: string[]) {
  const [rows, setRows] = createStore<string[]>(loadRows(storageKey) ?? [...examples])
  createEffect(() => {
    const snapshot = JSON.stringify([...rows])
    try {
      localStorage.setItem(storageKey, snapshot)
    } catch {
      // Storage blocked: the list just won't survive a reload
    }
  })
  const items = createMemo(() => parseWheelItems([...rows]))
  return { rows, setRows, items }
}

export const WheelItemsEditor: Component<{
  state: ReturnType<typeof createWheelItems>
}> = (p) => {
  const rows = () => p.state.rows
  const add = () => p.state.setRows(rows().length, '')
  const remove = (index: number) =>
    p.state.setRows((all) => all.filter((_, i) => i !== index))

  return (
    <div class="flex flex-col gap-2 sm:col-span-2">
      <span class={fieldClass.label}>Items</span>
      <Show
        when={rows().length > 0}
        fallback={<p class={fieldClass.help}>No items yet.</p>}
      >
        <ol class="flex flex-col gap-2">
          <For each={rows()}>
            {(row, index) => (
              <li class="flex items-center gap-2">
                <span class="text-fg-muted w-6 shrink-0 text-right text-sm tabular-nums">
                  {index() + 1}
                </span>
                <input
                  type="text"
                  aria-label={`Item ${index() + 1}`}
                  placeholder="What the wheel can land on"
                  maxLength={WHEEL_MAX_TEXT}
                  value={row}
                  onInput={(e) => p.state.setRows(index(), e.currentTarget.value)}
                  class={cn(fieldClass.input, 'h-10 min-w-0 flex-1')}
                />
                <IconButton
                  variant="ghost"
                  aria-label={`Remove item ${index() + 1}`}
                  onClick={() => remove(index())}
                >
                  <FaSolidTrash class="size-3.5" aria-hidden="true" />
                </IconButton>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Button
        size="sm"
        onClick={add}
        disabled={rows().length >= WHEEL_MAX_ITEMS}
        class="self-start"
      >
        <FaSolidPlus class="size-3" aria-hidden="true" />
        Add item
      </Button>
      <p class={fieldClass.help}>
        {WHEEL_MIN_ITEMS}–{WHEEL_MAX_ITEMS} items, clockwise from the pointer. Empty rows are left
        out. The same item twice gives it two chances.
      </p>
    </div>
  )
}

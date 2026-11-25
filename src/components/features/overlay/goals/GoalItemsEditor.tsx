import { type Component, createEffect, createMemo, For, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { FaSolidPlus, FaSolidTrash } from 'solid-icons/fa'
import { Button, IconButton } from '../../../ui/Button'
import { cn } from '../../../ui/cn'
import { fieldClass } from '../../../ui/Form'
import {
  type GoalItem,
  MAX_ITEMS,
  MAX_TEXT,
  parseAmount,
  sortItems,
} from './goalItems.ts'

type Row = { value: string; text: string }

const toRows = (items: GoalItem[]): Row[] =>
  items.map((item) => ({ value: String(item.value), text: item.text }))

const isBlank = (row: Row) => row.value.trim() === '' && row.text.trim() === ''

const isInvalid = (row: Row) =>
  !isBlank(row) && parseAmount(row.value) === undefined

function loadRows(storageKey: string): Row[] | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!Array.isArray(saved)) return undefined
    return saved
      .filter(
        (r) => typeof r?.value === 'string' && typeof r?.text === 'string',
      )
      .slice(0, MAX_ITEMS)
  } catch {
    return undefined
  }
}

/** The editable list, kept in this browser so the items survive a reload. */
export function createGoalItems(storageKey: string, examples: GoalItem[]) {
  const [rows, setRows] = createStore<Row[]>(
    loadRows(storageKey) ?? toRows(examples),
  )
  createEffect(() => {
    const snapshot = JSON.stringify(
      rows.map((r) => ({ value: r.value, text: r.text })),
    )
    try {
      localStorage.setItem(storageKey, snapshot)
    } catch {
      // Storage blocked: the list just won't survive a reload
    }
  })

  const items = createMemo(() =>
    sortItems(
      rows.flatMap((row) => {
        const value = parseAmount(row.value)
        return value === undefined
          ? []
          : [{ value, text: row.text.trim().slice(0, MAX_TEXT) }]
      }),
    ),
  )

  return { rows, setRows, items }
}

export const GoalItemsEditor: Component<{
  state: ReturnType<typeof createGoalItems>
  /** Plural heading, e.g. "Milestones". */
  label: string
  /** Singular for the add button and row labels, e.g. "milestone". */
  noun: string
  placeholder: string
}> = (p) => {
  const rows = () => p.state.rows
  const add = () => p.state.setRows(rows().length, { value: '', text: '' })
  const remove = (index: number) =>
    p.state.setRows((all) => all.filter((_, i) => i !== index))

  return (
    <div class="flex flex-col gap-2 sm:col-span-2">
      <span class={fieldClass.label}>{p.label}</span>
      <Show
        when={rows().length > 0}
        fallback={<p class={fieldClass.help}>No {p.noun}s yet.</p>}
      >
        <ul class="flex flex-col gap-2">
          <For each={rows()}>
            {(row, index) => (
              <li class="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  aria-label={`Amount of ${p.noun} ${index() + 1}`}
                  placeholder="Amount"
                  value={row.value}
                  onInput={(e) =>
                    p.state.setRows(index(), 'value', e.currentTarget.value)
                  }
                  data-invalid={isInvalid(row) ? '' : undefined}
                  aria-invalid={isInvalid(row)}
                  class={cn(
                    fieldClass.input,
                    'h-10 w-28 shrink-0 tabular-nums',
                  )}
                />
                <input
                  type="text"
                  aria-label={`Text of ${p.noun} ${index() + 1}`}
                  placeholder={p.placeholder}
                  maxLength={MAX_TEXT}
                  value={row.text}
                  onInput={(e) =>
                    p.state.setRows(index(), 'text', e.currentTarget.value)
                  }
                  class={cn(fieldClass.input, 'h-10 min-w-0 flex-1')}
                />
                <IconButton
                  variant="ghost"
                  aria-label={`Remove ${p.noun} ${index() + 1}`}
                  onClick={() => remove(index())}
                >
                  <FaSolidTrash class="size-3.5" aria-hidden="true" />
                </IconButton>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Button
        size="sm"
        onClick={add}
        disabled={rows().length >= MAX_ITEMS}
        class="self-start"
      >
        <FaSolidPlus class="size-3" aria-hidden="true" />
        Add {p.noun}
      </Button>
      <p class={fieldClass.help}>
        Amounts are in the currency below; the overlay sorts the {p.noun}s by
        amount. Rows without a valid amount are left out of the link. Up to{' '}
        {MAX_ITEMS} {p.noun}s; the list is kept in this browser.
      </p>
    </div>
  )
}

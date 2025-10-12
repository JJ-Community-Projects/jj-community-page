import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
} from 'solid-js'
import { debounce } from '@solid-primitives/scheduled'

export type EditableFieldOptions<T> = {
  // The current canonical value from the server/state
  source: Accessor<T | undefined>
  // Called after debounce when local value changes
  commit: (v: T) => void | Promise<void>
  // Equality check (defaults to strict ===)
  equals?: (a: T | undefined, b: T | undefined) => boolean
  // When to trigger commit
  debounceMs?: number
  // When this changes, we treat it like a new record (force resync when not focused)
  identity?: Accessor<unknown>
  // Optional parse/format helpers when binding to <input>
  parse?: (s: string) => T
  format?: (v: T | undefined) => string
}

export function useEditableField<T>(opts: EditableFieldOptions<T>) {
  const equals = opts.equals ?? ((a, b) => a === b)
  const debounceMs = opts.debounceMs ?? 250

  const [value, setValue] = createSignal<T | undefined>(opts.source())
  const [focused, setFocused] = createSignal(false)

  // Debounced commit
  const commitDebounced = debounce((v: T | undefined) => {
    if (v !== undefined) opts.commit(v)
  }, debounceMs)

  // Initial + external syncs: only when not focused
  createEffect(
    on(
      [
        () => (opts.identity ? opts.identity() : undefined),
        opts.source,
        focused,
      ],
      ([, src, isFocused]) => {
        if (!isFocused && !equals(value(), src)) setValue(() => src)
      },
    ),
  )

  // Input helpers for text/number inputs
  const inputValue = createMemo(() =>
    opts.format ? opts.format(value()) : String(value() ?? ''),
  )

  const onInput = (s: string) => {
    const next = opts.parse ? opts.parse(s) : (s as unknown as T)
    setValue(() => next)
    commitDebounced(next)
  }

  return {
    value,
    setValue,
    focused,
    setFocused,
    inputValue, // string
    onInput, // accepts string from <input>
  }
}

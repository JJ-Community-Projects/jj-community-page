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
  // Called after debounce (or on blur / Enter) when local value changes
  commit: (v: T) => void | Promise<void>
  // Equality check (defaults to strict ===)
  equals?: (a: T | undefined, b: T | undefined) => boolean
  // When to trigger commit: after each pause while typing (default), or only when the field
  // loses focus or Enter is pressed. 'blur' skips the commit when the value equals the source.
  commitOn?: 'debounce' | 'blur'
  // Pause before a debounced commit
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
  const onBlurOnly = opts.commitOn === 'blur'

  const [value, setValue] = createSignal<T | undefined>(opts.source())
  const [focused, setFocused] = createSignal(false)
  // Value of a blur / Enter commit still in flight; the field keeps it until the commit settles
  const [pending, setPending] = createSignal<{ v: T } | null>(null)

  // Debounced commit
  const commitDebounced = debounce((v: T | undefined) => {
    if (v !== undefined) opts.commit(v)
  }, debounceMs)

  const commitNow = () => {
    const v = value()
    if (v === undefined || equals(v, opts.source())) return
    const inFlight = pending()
    if (inFlight && equals(v, inFlight.v)) return
    const entry = { v }
    setPending(entry)
    Promise.resolve()
      .then(() => opts.commit(v))
      .catch(() => {
        // The caller's mutation state shows the error; the field falls back to the source
      })
      .finally(() => {
        if (pending() === entry) setPending(null)
      })
  }

  // Initial + external syncs: only when not focused and no commit is in flight
  createEffect(
    on(
      [
        () => (opts.identity ? opts.identity() : undefined),
        opts.source,
        focused,
        pending,
      ],
      ([, src, isFocused, inFlight]) => {
        if (!isFocused && !inFlight && !equals(value(), src)) setValue(() => src)
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
    if (!onBlurOnly) commitDebounced(next)
  }

  // Bind to the input's onBlur / onKeyDown; they commit only with commitOn: 'blur'
  const onBlur = () => {
    if (onBlurOnly) commitNow()
    setFocused(false)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (onBlurOnly && e.key === 'Enter') commitNow()
  }

  return {
    value,
    setValue,
    focused,
    setFocused,
    inputValue, // string
    onInput, // accepts string from <input>
    onBlur,
    onKeyDown,
  }
}

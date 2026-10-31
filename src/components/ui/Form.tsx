import { type Component, createUniqueId, For, type JSX, Show } from 'solid-js'
import { TextField as KTextField } from '@kobalte/core/text-field'
import { Checkbox as KCheckbox } from '@kobalte/core/checkbox'
import { Switch as KSwitch } from '@kobalte/core/switch'
import { SegmentedControl } from '@kobalte/core/segmented-control'
import {
  FaSolidCheck,
  FaSolidMagnifyingGlass,
  FaSolidXmark,
} from 'solid-icons/fa'
import { cn } from './cn'
import { Spinner } from './Status'

const labelClass = 'text-sm font-semibold text-fg'
const helpClass = 'text-xs text-fg-muted'
const errorClass = 'text-xs font-semibold text-danger-text'
const inputClass =
  'w-full rounded-group bg-surface-strong px-3 text-sm text-fg ring-1 ring-line-strong outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-accent disabled:opacity-50 data-invalid:ring-danger-500'

/** The field look, for controls the primitives don't cover (a slug field with a status icon, a colour input). */
export const fieldClass = {
  label: labelClass,
  help: helpClass,
  error: errorClass,
  input: inputClass,
}

type FieldProps = {
  label: string
  /** Id of the control the label points at. */
  for?: string
  description?: string
  error?: string
  class?: string
  children: JSX.Element
}

/** Label, help text and error around any control that isn't a TextField. */
export const Field: Component<FieldProps> = (props) => (
  <div class={cn('flex flex-col gap-1', props.class)}>
    <label for={props.for} class={labelClass}>
      {props.label}
    </label>
    {props.children}
    <Show
      when={props.error}
      fallback={
        <Show when={props.description}>
          <p class={helpClass}>{props.description}</p>
        </Show>
      }
    >
      <p class={errorClass}>{props.error}</p>
    </Show>
  </div>
)

type TextFieldProps = {
  label: string
  value?: string
  onChange?: (value: string) => void
  description?: string
  /** Shown instead of the description and marks the field invalid. */
  error?: string
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'number' | 'password'
  name?: string
  required?: boolean
  disabled?: boolean
  /** A textarea instead of a single line. */
  multiline?: boolean
  maxLength?: number
  class?: string
}

export const TextField: Component<TextFieldProps> = (props) => (
  <KTextField
    value={props.value}
    onChange={props.onChange}
    name={props.name}
    required={props.required}
    disabled={props.disabled}
    validationState={props.error ? 'invalid' : 'valid'}
    class={cn('flex flex-col gap-1', props.class)}
  >
    <KTextField.Label class={labelClass}>{props.label}</KTextField.Label>
    <Show
      when={props.multiline}
      fallback={
        <KTextField.Input
          type={props.type ?? 'text'}
          placeholder={props.placeholder}
          maxLength={props.maxLength}
          class={cn(inputClass, 'h-10')}
        />
      }
    >
      <KTextField.TextArea
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        autoResize
        class={cn(inputClass, 'min-h-20 py-2')}
      />
    </Show>
    <Show when={props.description && !props.error}>
      <KTextField.Description class={helpClass}>
        {props.description}
      </KTextField.Description>
    </Show>
    <KTextField.ErrorMessage class={errorClass}>
      {props.error}
    </KTextField.ErrorMessage>
  </KTextField>
)

type SearchFieldProps = {
  /** Accessible name; the field has no visible label. */
  label: string
  value: string
  onInput: (value: string) => void
  placeholder?: string
  /** Shows a spinner instead of the clear button. */
  loading?: boolean
  class?: string
}

export const SearchField: Component<SearchFieldProps> = (props) => (
  <div class={cn('relative w-full', props.class)}>
    <FaSolidMagnifyingGlass
      class="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
      aria-hidden="true"
    />
    <input
      type="search"
      aria-label={props.label}
      value={props.value}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      placeholder={props.placeholder}
      class={cn(
        inputClass,
        'h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden',
      )}
    />
    <div class="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
      <Show
        when={!props.loading}
        fallback={<Spinner class="text-fg-muted mr-1" />}
      >
        <Show when={props.value}>
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => props.onInput('')}
            class="text-fg-muted hover:text-fg flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-tint"
          >
            <FaSolidXmark class="size-3" aria-hidden="true" />
          </button>
        </Show>
      </Show>
    </div>
  </div>
)

type ToggleProps = {
  label: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  description?: string
  name?: string
  disabled?: boolean
  class?: string
}

export const Checkbox: Component<ToggleProps> = (props) => (
  <KCheckbox
    checked={props.checked}
    onChange={props.onChange}
    name={props.name}
    disabled={props.disabled}
    class={cn('flex items-start gap-2 data-disabled:opacity-50', props.class)}
  >
    <KCheckbox.Input class="peer" />
    <KCheckbox.Control class="rounded-media bg-surface-strong ring-line-strong peer-focus-visible:outline-accent data-checked:bg-accent data-checked:ring-accent mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center ring-1 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
      <KCheckbox.Indicator>
        <FaSolidCheck class="size-3 text-white" aria-hidden="true" />
      </KCheckbox.Indicator>
    </KCheckbox.Control>
    <div class="flex flex-col">
      <KCheckbox.Label class="text-fg cursor-pointer text-sm">
        {props.label}
      </KCheckbox.Label>
      <Show when={props.description}>
        <KCheckbox.Description class={helpClass}>
          {props.description}
        </KCheckbox.Description>
      </Show>
    </div>
  </KCheckbox>
)

export const Switch: Component<ToggleProps> = (props) => (
  <KSwitch
    checked={props.checked}
    onChange={props.onChange}
    name={props.name}
    disabled={props.disabled}
    class={cn(
      'flex items-start justify-between gap-3 data-disabled:opacity-50',
      props.class,
    )}
  >
    <div class="flex flex-col">
      <KSwitch.Label class="text-fg cursor-pointer text-sm">
        {props.label}
      </KSwitch.Label>
      <Show when={props.description}>
        <KSwitch.Description class={helpClass}>
          {props.description}
        </KSwitch.Description>
      </Show>
    </div>
    <KSwitch.Input class="peer" />
    <KSwitch.Control class="peer-focus-visible:outline-accent data-checked:bg-accent inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 dark:bg-neutral-600 p-0.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
      <KSwitch.Thumb class="shadow-tile size-5 rounded-full bg-white transition-transform data-checked:translate-x-4" />
    </KSwitch.Control>
  </KSwitch>
)

type SegmentedOption = { value: string; label: string; icon?: JSX.Element }

type SegmentedProps = {
  /** Accessible name of the group. */
  label: string
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  class?: string
}

/**
 * Pill bar with an accent fill on the selected option (the extension's tab bar).
 * With exactly two options it acts as a toggle: re-selecting the checked option
 * switches to the other one.
 */
export const Segmented: Component<SegmentedProps> = (props) => {
  const id = createUniqueId()
  // A checked radio fires no change event on a label click or Space, so flip
  // to the other option here. Returns the value switched to, if any.
  const toggleFrom = (value: string) => {
    if (props.options.length !== 2 || value !== props.value) return
    const other = props.options.find((o) => o.value !== value)
    if (other) props.onChange(other.value)
    return other?.value
  }
  // Space on a checked radio dispatches no click; toggle and move focus to the
  // newly checked option, as the arrow keys do.
  const onKeyDown = (e: KeyboardEvent, value: string) => {
    if (e.key !== ' ') return
    const target = e.currentTarget as HTMLInputElement
    const next = toggleFrom(value)
    if (next === undefined) return
    e.preventDefault()
    const inputs = target
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    Array.from(inputs ?? [])
      .find((input) => input.value === next)
      ?.focus()
  }
  return (
    <SegmentedControl
      value={props.value}
      onChange={props.onChange}
      aria-labelledby={id}
      class={cn(
        'bg-surface-strong ring-line-strong relative inline-flex max-w-full rounded-full p-1 ring-1',
        props.class,
      )}
    >
      <SegmentedControl.Label id={id} class="sr-only">
        {props.label}
      </SegmentedControl.Label>
      <SegmentedControl.Indicator class="bg-accent shadow-tile absolute rounded-full transition-all duration-200" />
      <For each={props.options}>
        {(option) => (
          <SegmentedControl.Item
            value={option.value}
            class="relative z-10 min-w-0 flex-1"
          >
            <SegmentedControl.ItemInput
              class="peer"
              onClick={() => toggleFrom(option.value)}
              onKeyDown={(e) => onKeyDown(e, option.value)}
            />
            <SegmentedControl.ItemLabel
              class={cn(
                'text-fg-muted peer-focus-visible:outline-accent hover:text-fg flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors peer-focus-visible:outline-2 data-checked:text-white',
                props.size === 'sm'
                  ? 'px-2.5 py-0.5 text-xs'
                  : 'px-3.5 py-1.5 text-sm',
              )}
            >
              {option.icon}
              {option.label}
            </SegmentedControl.ItemLabel>
          </SegmentedControl.Item>
        )}
      </For>
    </SegmentedControl>
  )
}

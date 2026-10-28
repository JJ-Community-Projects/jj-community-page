import { Select as KSelect } from '@kobalte/core/select'
import { FaSolidCheck, FaSolidChevronDown } from 'solid-icons/fa'
import { cn, focusRing } from './cn'

type SelectProps<T extends string> = {
  /** Accessible name; shown as a small label above when `showLabel` is set. */
  label: string
  showLabel?: boolean
  options: T[]
  value: T
  onChange: (value: T) => void
  /** Text for an option (and for the trigger). */
  format: (value: T) => string
  size?: 'sm' | 'md'
  class?: string
}

/** Single-value dropdown on Kobalte Select: a pill trigger and a white listbox. */
export const Select = <T extends string>(props: SelectProps<T>) => (
  <KSelect<T>
    value={props.value}
    onChange={(value) => value !== null && props.onChange(value)}
    options={props.options}
    class={cn('flex flex-col gap-1', props.class)}
    itemComponent={(item) => (
      <KSelect.Item
        item={item.item}
        class="text-fg rounded-media flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-black/5"
      >
        <KSelect.ItemLabel>
          {props.format(item.item.rawValue)}
        </KSelect.ItemLabel>
        <KSelect.ItemIndicator>
          <FaSolidCheck class="text-accent size-3" aria-hidden="true" />
        </KSelect.ItemIndicator>
      </KSelect.Item>
    )}
  >
    <KSelect.Label
      class={
        props.showLabel ? 'text-fg-muted text-xs font-semibold' : 'sr-only'
      }
    >
      {props.label}
    </KSelect.Label>
    <KSelect.Trigger
      class={cn(
        'bg-surface-strong text-fg ring-line-strong hover:bg-surface inline-flex max-w-full items-center justify-between gap-2 rounded-full font-semibold ring-1 transition-colors',
        props.size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        focusRing,
      )}
    >
      <KSelect.Value<T> class="truncate">
        {(state) => props.format(state.selectedOption())}
      </KSelect.Value>
      <KSelect.Icon>
        <FaSolidChevronDown class="text-fg-muted size-3" aria-hidden="true" />
      </KSelect.Icon>
    </KSelect.Trigger>
    <KSelect.Portal>
      <KSelect.Content class="rounded-group bg-surface-strong shadow-tile-hover ring-line z-50 p-1 ring-1">
        <KSelect.Listbox class="flex max-h-72 flex-col gap-0.5 overflow-y-auto" />
      </KSelect.Content>
    </KSelect.Portal>
  </KSelect>
)

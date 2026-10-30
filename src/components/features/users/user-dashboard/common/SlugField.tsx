import { type Component, For, Show } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { FaSolidCheck } from 'solid-icons/fa'
import { fieldClass } from '../../../../ui/Form'
import { Spinner } from '../../../../ui/Status'
import { cn } from '../../../../ui/cn'

type SlugFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  checking: boolean
  valid: boolean
  /** The server's error, else the "not available" text when the slug is taken. */
  error?: string
  suggestions: string[]
  onPick: (suggestion: string) => void
  /** The public URL path before the slug, e.g. `schedules`. */
  path: string
  /** The slug as it will be stored (F-59). */
  normalized: string
}

/** A slug input with the availability check: spinner, check mark, error and suggestions. */
export const SlugField: Component<SlugFieldProps> = (props) => (
  <TextField
    value={props.value}
    onChange={props.onChange}
    validationState={props.valid ? 'valid' : 'invalid'}
    class="flex flex-col gap-1"
  >
    <TextField.Label class={fieldClass.label}>{props.label}</TextField.Label>
    <div class="relative">
      <TextField.Input
        class={cn(fieldClass.input, 'h-10 pr-9')}
        placeholder={props.placeholder}
      />
      <div class="absolute top-1/2 right-3 -translate-y-1/2">
        <Show
          when={props.checking}
          fallback={
            <Show when={props.valid}>
              <FaSolidCheck class="text-success size-4" aria-hidden="true" />
            </Show>
          }
        >
          <Spinner class="text-accent" />
        </Show>
      </div>
    </div>
    <TextField.ErrorMessage class={fieldClass.error}>
      {props.error}
    </TextField.ErrorMessage>
    <Show when={props.suggestions.length > 0}>
      <ul class="flex flex-wrap gap-1.5">
        <For each={props.suggestions}>
          {(suggestion) => (
            <li>
              <button
                type="button"
                class="bg-accent-50 text-accent-700 ring-accent-200 hover:bg-accent-100 cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1"
                onClick={() => props.onPick(suggestion)}
              >
                {suggestion}
              </button>
            </li>
          )}
        </For>
      </ul>
    </Show>
    <p class={fieldClass.help}>
      This will be used in URLs: jinglejam.ostof.dev/{props.path}/
      {props.normalized || `your-${props.path.replace(/s$/, '')}-slug`}
    </p>
  </TextField>
)

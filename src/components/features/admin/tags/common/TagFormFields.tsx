import { type Component, createUniqueId } from 'solid-js'
import { Checkbox, Field, fieldClass } from '../../../../ui/Form'
import { cn } from '../../../../ui/cn'

export type TagDraft = {
  name: string
  slug: string
  description: string | null
  color: string
  visible: boolean
}

/** A nested panel inside a category tile (a tag, the add-tag form). */
export const nestedSurface = 'rounded-group bg-surface p-3 ring-1 ring-line'

const input = cn(fieldClass.input, 'h-10')

/** Name, slug, description, colour and visibility: shared by the category and tag forms. */
export const TagFormFields: Component<{
  draft: TagDraft
  onChange: (patch: Partial<TagDraft>) => void
  namePlaceholder: string
  slugPlaceholder: string
}> = (props) => {
  const id = createUniqueId()
  return (
    <div class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto_auto]">
      <Field label="Name" for={`${id}-name`}>
        <input
          id={`${id}-name`}
          class={input}
          required
          placeholder={props.namePlaceholder}
          value={props.draft.name}
          onInput={(e) => props.onChange({ name: e.currentTarget.value })}
        />
      </Field>
      <Field label="Slug" for={`${id}-slug`}>
        <input
          id={`${id}-slug`}
          class={input}
          required
          pattern="^[a-z0-9-]+$"
          placeholder={props.slugPlaceholder}
          value={props.draft.slug}
          onInput={(e) => props.onChange({ slug: e.currentTarget.value })}
        />
      </Field>
      <Field label="Description" for={`${id}-description`}>
        <input
          id={`${id}-description`}
          class={input}
          placeholder="Optional description"
          value={props.draft.description || ''}
          onInput={(e) =>
            props.onChange({ description: e.currentTarget.value || null })
          }
        />
      </Field>
      <Field label="Color" for={`${id}-color`}>
        <input
          id={`${id}-color`}
          type="color"
          class={cn(input, 'w-full cursor-pointer p-1 lg:w-16')}
          value={props.draft.color}
          onInput={(e) => props.onChange({ color: e.currentTarget.value })}
        />
      </Field>
      <Checkbox
        label="Visible"
        checked={props.draft.visible}
        onChange={(visible) => props.onChange({ visible })}
        class="pb-2.5"
      />
    </div>
  )
}

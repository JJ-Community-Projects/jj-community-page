import { type JSX, type ParentComponent } from 'solid-js'
import { Accordion as KAccordion } from '@kobalte/core/accordion'
import { FaSolidChevronDown } from 'solid-icons/fa'
import { cn, focusRing, tileSurface } from './cn'

/** Kobalte's accordion root (`collapsible`, `multiple`, `value`, `onChange`). */
export const Accordion = KAccordion

/** One accordion row: a tile-styled trigger; the content below picks its own surface. */
export const AccordionItem: ParentComponent<{
  value: string
  title: JSX.Element
  class?: string
}> = (props) => (
  <KAccordion.Item
    value={props.value}
    class={cn('flex flex-col gap-2', props.class)}
  >
    <KAccordion.Header>
      <KAccordion.Trigger
        class={cn(
          tileSurface,
          focusRing,
          'group flex w-full items-center gap-3 px-4 py-3 text-left font-semibold',
        )}
      >
        <span class="min-w-0 flex-1">{props.title}</span>
        <FaSolidChevronDown
          class="text-fg-muted size-3.5 shrink-0 transition-transform group-data-expanded:rotate-180"
          aria-hidden="true"
        />
      </KAccordion.Trigger>
    </KAccordion.Header>
    <KAccordion.Content>{props.children}</KAccordion.Content>
  </KAccordion.Item>
)

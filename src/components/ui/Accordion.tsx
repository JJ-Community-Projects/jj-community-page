import { children, type JSX, type ParentComponent, Show } from 'solid-js'
import { Accordion as KAccordion } from '@kobalte/core/accordion'
import { FaSolidChevronDown } from 'solid-icons/fa'
import { cn, focusRing, tileSurface } from './cn'

/** Kobalte's accordion root (`collapsible`, `multiple`, `value`, `onChange`). */
export const Accordion = KAccordion

/**
 * Slide animation for `Accordion.Content`. The 4px gutter (padding, cancelled by a negative margin) keeps the
 * content's rings and tile shadows outside the clip while it animates.
 */
export const accordionContentMotion =
  '-m-1 overflow-hidden p-1 motion-safe:data-closed:animate-accordion-up motion-safe:data-expanded:animate-accordion-down'

/** One accordion row: a tile-styled trigger; the content below picks its own surface. */
export const AccordionItem: ParentComponent<{
  value: string
  title: JSX.Element
  /** Heading level of the trigger; 3 by default, 2 for top-level sections below a page's h1. */
  level?: 2 | 3
  /** Read-only status in the trigger, before the chevron (e.g. a Chip). */
  summary?: JSX.Element
  /** Keeps the content mounted (and its state) while closed; it is hidden, also from screen readers. */
  forceMount?: boolean
  /** Anchor id on the item. */
  id?: string
  class?: string
}> = (props) => {
  const summary = children(() => props.summary)
  return (
    <KAccordion.Item
      value={props.value}
      id={props.id}
      forceMount={props.forceMount}
      class={cn('flex scroll-mt-4 flex-col gap-2', props.class)}
    >
      <KAccordion.Header as={props.level === 2 ? 'h2' : 'h3'}>
        <KAccordion.Trigger
          class={cn(
            tileSurface,
            focusRing,
            'group flex w-full items-center gap-3 px-4 py-3 text-left font-semibold',
          )}
        >
          <span class="min-w-0 flex-1">{props.title}</span>
          <Show when={summary()}>
            <span class="flex shrink-0 items-center gap-2">{summary()}</span>
          </Show>
          <FaSolidChevronDown
            class="text-fg-muted size-3.5 shrink-0 transition-transform group-data-expanded:rotate-180"
            aria-hidden="true"
          />
        </KAccordion.Trigger>
      </KAccordion.Header>
      {/* Always-mounted content just hides when closed; the rest slides */}
      <KAccordion.Content
        class={props.forceMount ? 'data-closed:hidden' : accordionContentMotion}
      >
        {props.children}
      </KAccordion.Content>
    </KAccordion.Item>
  )
}

import { type Component, type JSX, Match, type ParentComponent, Switch } from 'solid-js'
import { AccordionItem } from '../../../ui/Accordion'
import { cn, groupSurface } from '../../../ui/cn'
import { Tile } from '../../../ui/Tile'
import { Spinner } from '../../../ui/Status'

type AdminSectionProps = {
  /** Accordion key; the anchor is `#admin-<value>`. */
  value: string
  title: string
  /** Read-only status shown in the trigger, also while closed. */
  summary?: JSX.Element
  /** Keep the body (and typed text) mounted while closed. */
  forceMount?: boolean
}

/** One top-level admin section: an h2 trigger tile and the body in a tile below it. */
export const AdminSection: ParentComponent<AdminSectionProps> = (props) => (
  <AccordionItem
    value={props.value}
    id={`admin-${props.value}`}
    title={props.title}
    level={2}
    summary={props.summary}
    forceMount={props.forceMount}
  >
    <Tile class="flex flex-col gap-4">{props.children}</Tile>
  </AccordionItem>
)

/** Table classes shared by the admin tables (inside a body tile). */
export const adminTable = {
  wrap: cn(groupSurface, 'overflow-x-auto'),
  table: 'min-w-full text-left text-sm',
  head: 'border-line text-fg-muted border-b text-xs font-semibold',
  th: 'px-3 py-2 whitespace-nowrap',
  row: 'border-line border-b align-top last:border-0',
  td: 'px-3 py-2',
}

/** Small text link inside admin bodies. */
export const adminLink = 'text-accent-700 hover:underline'

/** The result of a fire-and-forget admin action, next to its button. */
export const MutationStatus: Component<{
  status: 'idle' | 'pending' | 'success' | 'error'
}> = (props) => (
  <Switch>
    <Match when={props.status === 'pending'}>
      <Spinner class="text-fg-muted" />
    </Match>
    <Match when={props.status === 'success'}>
      <span class="text-success-700 text-xs font-semibold">Done</span>
    </Match>
    <Match when={props.status === 'error'}>
      <span class="text-danger-700 text-xs font-semibold">Failed</span>
    </Match>
  </Switch>
)

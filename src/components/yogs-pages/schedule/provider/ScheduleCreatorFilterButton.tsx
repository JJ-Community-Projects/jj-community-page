import {type Component, createSignal, For, onCleanup, Show} from "solid-js";
import {useCreatorFilter} from "./CreatorFilterProvider.tsx";
import {BiRegularReset} from "solid-icons/bi";
import {type ModalSignal} from "../../../../lib/createModalSignal.ts";
import {FaSolidCheck, FaSolidShare, FaSolidXmark} from 'solid-icons/fa'
import {useYogsSchedule} from "./YogsScheduleProvider.tsx";
import {Button, IconButton} from "../../../ui/Button";
import {Dialog} from "../../../ui/Dialog";
import {SearchField, Segmented} from "../../../ui/Form";
import {Avatar} from "../../../ui/Avatar";
import {TileGroup} from "../../../ui/Tile";
import {cn, focusRing} from "../../../ui/cn";
import {sectionLabel} from "../../../features/schedules/common/StreamParticipants";
import {CREATOR_FALLBACK_COLOR} from "../../creators/YogsCreatorChip.tsx";
import type {YogsCreator} from "../../../../lib/orpc/private/yogs/contract.ts";

/** Copies the filter link; `copied()` stays true for 2 s after it worked. */
export const useCopyFilterLink = () => {
  const {copyFilterUrl} = useCreatorFilter()
  const [copied, setCopied] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  const copy = async () => {
    if (!(await copyFilterUrl())) return
    setCopied(true)
    clearTimeout(timer)
    timer = setTimeout(() => setCopied(false), 2000)
  }
  return {copied, copy}
}

interface FilterIconButtonProps {
  class?: string
  /** On hover / keyboard focus the button grows into the free width of its row and shows its label. */
  expand?: boolean
}

// Hovered, the button takes the rest of the row while its label slides open next to the icon. The row
// is ~85px free at 1280, so the label is text-xs below 2xl and ends in an ellipsis where even that is too wide.
const expandButton = 'group overflow-hidden transition-[flex-grow,background-color] duration-200 hover:grow focus-visible:grow 2xl:px-[calc(var(--yogs-rem,1rem)*0.25)]'
const expandLabel = 'max-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[length:calc(var(--yogs-rem,1rem)*0.75)]/[1.333] opacity-0 transition-[max-width,margin,opacity] duration-200 2xl:text-[length:calc(var(--yogs-rem,1rem)*0.875)]/[1.429] group-hover:ml-[calc(var(--yogs-rem,1rem)*0.25)] group-hover:max-w-[calc(var(--yogs-rem,1rem)*6)] group-hover:opacity-100 group-focus-visible:ml-[calc(var(--yogs-rem,1rem)*0.25)] group-focus-visible:max-w-[calc(var(--yogs-rem,1rem)*6)] group-focus-visible:opacity-100 2xl:group-hover:ml-[calc(var(--yogs-rem,1rem)*0.375)] 2xl:group-focus-visible:ml-[calc(var(--yogs-rem,1rem)*0.375)]'

/** The button's label for `expand`; hidden from screen readers, the aria-label already says it. */
const ExpandLabel: Component<{show?: boolean, children: string}> = props => (
  <Show when={props.show}>
    <span class={expandLabel} aria-hidden="true">{props.children}</span>
  </Show>
)

export const FilterResetButton: Component<FilterIconButtonProps> = props => {
  const {isEmpty, reset} = useCreatorFilter()
  return (
    <Show when={!isEmpty()}>
      <IconButton
        variant="canvas"
        aria-label="Reset filter"
        title="Reset filter"
        class={cn(props.expand && expandButton, props.class)}
        onClick={reset}
      >
        <BiRegularReset class="size-[var(--yogs-rem,1rem)] shrink-0"/>
        <ExpandLabel show={props.expand}>Reset</ExpandLabel>
      </IconButton>
    </Show>
  )
}

export const FilterShareButton: Component<FilterIconButtonProps> = props => {
  const {isEmpty} = useCreatorFilter()
  const {mounted} = useYogsSchedule()
  const {copied, copy} = useCopyFilterLink()
  // navigator only after mount: the server has no clipboard, and hydration must match its markup
  return (
    <Show when={!isEmpty() && mounted() && navigator.clipboard}>
      <IconButton
        variant="canvas"
        aria-label="Copy filter link"
        title={copied() ? 'Copied' : 'Copy filter link'}
        class={cn(props.expand && expandButton, props.class)}
        onClick={copy}
      >
        <Show when={copied()} fallback={<FaSolidShare class="size-[var(--yogs-rem,1rem)] shrink-0"/>}>
          <FaSolidCheck class="size-[var(--yogs-rem,1rem)] shrink-0"/>
        </Show>
        <ExpandLabel show={props.expand}>{copied() ? 'Copied' : 'Share Link'}</ExpandLabel>
      </IconButton>
      <span class="sr-only" aria-live="polite">{copied() ? 'Link copied' : ''}</span>
    </Show>
  )
}

interface FilterDialogProps {
  modalSignal: ModalSignal
}

/** Creator filter: search, sort, Any / All, the selected creators, one row per creator. */
export const FilterDialog: Component<FilterDialogProps> = props => {
  const {streams, mounted} = useYogsSchedule()
  const {reset, isEmpty, filteredStreams} = useCreatorFilter()
  const {copied, copy} = useCopyFilterLink()

  const total = () => streams().length
  const summary = () =>
    isEmpty()
      ? `${total()} streams`
      : `${filteredStreams().length} of ${total()} streams match`

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title="Filter by creator"
      description={<span aria-live="polite">{summary()}</span>}
      footer={
        <>
          <Button variant="ghost" size="sm" class="mr-auto" disabled={isEmpty()} onClick={reset}>
            Reset
          </Button>
          <Show when={mounted() && navigator.clipboard}>
            <Button size="sm" disabled={isEmpty()} onClick={copy}>
              {copied() ? 'Copied' : 'Copy link'}
            </Button>
          </Show>
          <Button variant="primary" size="sm" onClick={() => props.modalSignal.close()}>
            Done
          </Button>
        </>
      }
    >
      <FilterDialogBody/>
    </Dialog>
  )
}

const FilterDialogBody: Component = () => {
  const {creators} = useYogsSchedule()
  const {filter, toggleFilter, appearanceCount, includesFilter, sortByName, setSortByName, and, toggleAnd} =
    useCreatorFilter()
  const [search, setSearch] = createSignal('')

  const byName = (a: YogsCreator, b: YogsCreator) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())

  const list = () => {
    const query = search().trim().toLowerCase()
    const found = query
      ? creators().filter(c => c.name.toLowerCase().includes(query))
      : creators()
    return found.sort((a, b) =>
      sortByName() ? byName(a, b) : appearanceCount(b.id) - appearanceCount(a.id) || byName(a, b),
    )
  }

  const selected = () =>
    filter()
      .map(id => creators().find(c => c.id === id))
      .filter((c): c is YogsCreator => !!c)

  return (
    <div class="flex flex-col gap-3">
      {/* Stays on top while the list scrolls; covers the body's top padding */}
      <div class="bg-surface-strong sticky -top-3 z-10 -mx-4 -mt-3 flex flex-col gap-2.5 px-4 pt-3 pb-2">
        <SearchField label="Search creators" placeholder="Search creators" value={search()} onInput={setSearch}/>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div class="flex items-center gap-2">
            <span class={sectionLabel}>Sort</span>
            <Segmented
              label="Sort creators"
              size="sm"
              // Options share the width equally; "Appearances" needs more than half of its own
              class="w-52"
              value={sortByName() ? 'name' : 'appearances'}
              onChange={value => setSortByName(value === 'name')}
              options={[{value: 'name', label: 'Name'}, {value: 'appearances', label: 'Appearances'}]}
            />
          </div>
          <div class="flex items-center gap-2">
            <span class={sectionLabel}>Match</span>
            <Segmented
              label="Match"
              size="sm"
              value={and() ? 'all' : 'any'}
              onChange={value => {
                if ((value === 'all') !== and()) toggleAnd()
              }}
              options={[{value: 'any', label: 'Any'}, {value: 'all', label: 'All'}]}
            />
          </div>
        </div>
        <p class="text-fg-muted text-xs">
          Any: streams with at least one of them · All: streams with all of them
        </p>
        <Show when={selected().length > 0}>
          <div class="flex flex-wrap gap-1.5">
            <For each={selected()}>
              {creator => (
                <button
                  type="button"
                  class={cn('bg-accent-soft text-accent-text ring-accent-soft-line inline-flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-xs font-semibold ring-1 hover:brightness-95', focusRing)}
                  aria-label={`Remove ${creator.name}`}
                  onClick={() => toggleFilter(creator.id)}
                >
                  {creator.name}
                  <FaSolidXmark class="size-3" aria-hidden="true"/>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show
        when={list().length > 0}
        fallback={<p class="text-fg-muted py-6 text-center text-sm">No creator matches “{search()}”.</p>}
      >
        <TileGroup pad="none" class="divide-line flex flex-col divide-y overflow-hidden">
          <For each={list()}>
            {creator => (
              <CreatorRow
                creator={creator}
                count={appearanceCount(creator.id)}
                checked={includesFilter(creator.id)}
                onToggle={() => toggleFilter(creator.id)}
              />
            )}
          </For>
        </TileGroup>
      </Show>
    </div>
  )
}

interface CreatorRowProps {
  creator: YogsCreator
  count: number
  checked: boolean
  onToggle: () => void
}

/** The whole row toggles; it is the checkbox. */
const CreatorRow: Component<CreatorRowProps> = props => (
  <button
    type="button"
    role="checkbox"
    aria-checked={props.checked}
    class={cn('flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-tint focus-visible:-outline-offset-2', focusRing)}
    onClick={() => props.onToggle()}
  >
    <Avatar
      src={props.creator.imageUrl}
      alt=""
      fallback={props.creator.name.charAt(0)}
      size="xs"
      shape="circle"
      ringColor={props.creator.color ?? CREATOR_FALLBACK_COLOR}
      class="ring-2"
    />
    <span class="min-w-0 flex-1 truncate font-medium">{props.creator.name}</span>
    <span class="text-fg-muted text-xs tabular-nums">
      {props.count} {props.count === 1 ? 'stream' : 'streams'}
    </span>
    <CheckMark checked={props.checked}/>
  </button>
)

/** The checkbox square of a `role="checkbox"` row (filter and export dialogs). */
export const CheckMark: Component<{checked: boolean}> = props => (
  <span
    class={cn(
      'rounded-media ring-line-strong flex size-5 shrink-0 items-center justify-center ring-1 transition-colors',
      props.checked ? 'bg-accent ring-accent' : 'bg-surface-strong',
    )}
    aria-hidden="true"
  >
    <Show when={props.checked}>
      <FaSolidCheck class="size-3 text-white"/>
    </Show>
  </span>
)

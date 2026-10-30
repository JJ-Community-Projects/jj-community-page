import {
  type Component,
  createSignal,
  For,
  type JSX,
  Match,
  Show,
  Switch,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Section } from '../../../../ui/Tile'
import { ListRow } from '../../../../ui/ListRow'
import { Avatar } from '../../../../ui/Avatar'
import { Alert, EmptyState, Skeleton } from '../../../../ui/Status'
import { Chip } from '../../../../ui/Labels'
import { cn } from '../../../../ui/cn'

/** The user fields the account lists show (friends, requests, blocks, team members). */
export type ListUser = {
  userId: number
  username: string
  profileImage?: string | null
  twitchLogin?: string | null
  tiltifySlug?: string | null
}

const initial = (name: string) => (name || 'U')[0].toUpperCase()

/** A user row: avatar · name (profile link, new tab) + Twitch login · actions. */
export const UserRow: Component<{
  user: ListUser
  /** Shown after the name, e.g. an "Owner" chip. */
  badge?: JSX.Element
  actions?: JSX.Element
}> = (props) => (
  <ListRow
    surface="group"
    trailingAlign="center"
    media={
      <Avatar
        src={props.user.profileImage || null}
        alt={`${props.user.username}'s profile`}
        size="md"
        shape="circle"
        fallback={initial(props.user.username)}
      />
    }
    title={
      <span class="flex min-w-0 items-center gap-2">
        <a
          href={`/${props.user.tiltifySlug || props.user.username}`}
          target="_blank"
          class="truncate hover:underline"
        >
          {props.user.username || 'Unknown User'}
        </a>
        {props.badge}
      </span>
    }
    subline={
      props.user.twitchLogin ? `Twitch: ${props.user.twitchLogin}` : undefined
    }
    trailing={props.actions}
  />
)

const RowSkeletons: Component = () => (
  <div class="grid gap-2">
    <Skeleton class="h-14" />
    <Skeleton class="h-14" />
    <Skeleton class="h-14" />
  </div>
)

type UserListSectionProps<T> = {
  title: string
  icon: JSX.Element
  /** Next to the title, e.g. a count. */
  status?: JSX.Element
  items: T[]
  loading: boolean
  /** The list failed to load: `errorTitle` + this message. */
  error?: string | false
  errorTitle: string
  /** Failed actions on the rows (remove, accept, …), shown above the list. */
  actionErrors?: (string | false | undefined)[]
  empty: { title: string; text: string; icon?: JSX.Element }
  /** Grid columns from `sm` up; one column below. */
  columns?: 1 | 2
  children: (item: T) => JSX.Element
}

/**
 * A titled list tile (h3) with the one loading / error / empty grammar. The browser tests find a
 * list by its h3 and scope to the heading's grandparent, the tile.
 */
export const UserListSection = <T,>(props: UserListSectionProps<T>) => (
  <Section
    level={3}
    title={props.title}
    icon={props.icon}
    action={props.status}
  >
    <div class="flex flex-col gap-2">
      <For each={(props.actionErrors ?? []).filter(Boolean)}>
        {(message) => <Alert tone="danger">{message}</Alert>}
      </For>
      <Switch>
        <Match when={props.loading}>
          <RowSkeletons />
        </Match>
        <Match when={props.error}>
          <Alert tone="danger" title={props.errorTitle}>
            {props.error || 'Unknown error occurred'}
          </Alert>
        </Match>
        <Match when={props.items.length === 0}>
          <EmptyState icon={props.empty.icon} title={props.empty.title}>
            {props.empty.text}
          </EmptyState>
        </Match>
        <Match when={props.items.length > 0}>
          <div
            class={cn(
              'grid grid-cols-1 gap-2',
              props.columns === 2 && 'sm:grid-cols-2',
            )}
          >
            <For each={props.items}>{(item) => props.children(item)}</For>
          </div>
        </Match>
      </Switch>
    </div>
  </Section>
)

/** A user search hit (users_search_view): Tiltify name, else Twitch name. */
export type SearchUser = {
  userId: number
  tiltifyUsername?: string | null
  twitchUsername?: string | null
}

export const searchName = (user: SearchUser) =>
  user.tiltifyUsername || user.twitchUsername || 'Unknown User'

type UserSearchResultsProps = {
  results: SearchUser[]
  /** The term the results belong to. */
  query: string
  loading: boolean
  searchError?: string | false
  /** The row action failed (send request, block, invite). */
  actionError?: string | false
  /** Ends the empty state's hint: "… search for users <purpose>." */
  purpose: JSX.Element
  action: (user: SearchUser) => JSX.Element
  /** 4 inside a section that is itself an h4 (team admin). */
  level?: 3 | 4
}

/**
 * The results under a user search (friends, blocks, team invites). Its own h3 "Search Results"
 * block: the tests scope to the heading's grandparent.
 */
export const UserSearchResults: Component<UserSearchResultsProps> = (props) => (
  <div class="flex flex-col gap-2">
    <div class="flex min-h-6 items-center gap-2">
      <Dynamic
        component={props.level === 4 ? 'h5' : 'h3'}
        class="text-sm font-semibold"
      >
        Search Results
      </Dynamic>
      <Show when={props.loading}>
        <Chip tone="accent" size="sm">
          Searching
        </Chip>
      </Show>
    </div>
    <Show when={props.actionError}>
      <Alert tone="danger">{props.actionError}</Alert>
    </Show>
    <Switch
      fallback={
        <EmptyState
          level={props.level === 4 ? undefined : 4}
          title={props.query.length > 0 ? 'No users found' : 'Start searching'}
          class="py-4"
        >
          <Show
            when={props.query.length > 0}
            fallback={
              <>Enter a username above to search for users {props.purpose}.</>
            }
          >
            No users found matching "{props.query}". Try a different search
            term.
          </Show>
        </EmptyState>
      }
    >
      <Match when={props.searchError}>
        <Alert tone="danger" title="Error searching users">
          {props.searchError || 'Unknown error occurred'}
        </Alert>
      </Match>
      <Match when={props.loading && props.results.length === 0}>
        <RowSkeletons />
      </Match>
      <Match when={props.results.length > 0}>
        <div class="grid gap-2">
          <For each={props.results}>
            {(user) => (
              <ListRow
                surface="group"
                trailingAlign="center"
                media={
                  <Avatar
                    alt=""
                    size="md"
                    shape="circle"
                    fallback={initial(searchName(user))}
                  />
                }
                title={searchName(user)}
                subline={
                  user.twitchUsername && user.tiltifyUsername
                    ? `Twitch: ${user.twitchUsername}`
                    : undefined
                }
                trailing={props.action(user)}
              />
            )}
          </For>
        </div>
      </Match>
    </Switch>
  </div>
)

/**
 * The row a confirm dialog asks about: `ask(row)` opens it; `run(action)` closes it once the action
 * succeeded and leaves it open on failure (the list shows the error).
 */
export const createConfirm = <T,>() => {
  const [target, setTarget] = createSignal<T | null>(null)
  const close = () => setTarget(null)
  return {
    target,
    isOpen: () => target() !== null,
    ask: (row: T) => setTarget(() => row),
    close,
    onOpenChange: (open: boolean) => {
      if (!open) close()
    },
    run: (action: (row: T) => Promise<unknown>) => {
      const row = target()
      if (row !== null) action(row).then(close, () => {})
    },
  }
}

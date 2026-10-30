import { type Component, For, Show } from 'solid-js'
import type {
  Currencies,
  JJCauseType,
  Overview,
} from '../../../lib/orpc/private/jjData/contract.ts'
import type { CharityStatic } from '../../../content/schema.ts'
import { useIsJJ } from '../../../lib/utils/jjDates.ts'
import { DateTime } from 'luxon'
import { Numeric } from 'solid-i18n'
import { FaSolidChevronDown, FaSolidGlobe } from 'solid-icons/fa'
import { Accordion, accordionContentMotion } from '../../ui/Accordion'
import {
  DiscordIcon,
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../icons/JJIcons.tsx'
import { useCurrency } from '../CurrencyProvider.tsx'
import { Avatar } from '../../ui/Avatar'
import { cn, focusRing, tileSurface } from '../../ui/cn'

type CharityItemData = {
  donationData?: JJCauseType
  staticData: CharityStatic
}

const name = (it: CharityItemData) =>
  it.donationData?.name || it.staticData.name

/**
 * Inline style that gives an element a view-transition-name, so the sidebar's open/close view transition
 * (CommunityCharitiesOverview) morphs it from its wide to its compact place. The kind picks its motion in
 * global.css: a surface stretches to the animated box, text keeps its size and cross-fades, an extra
 * (only in one of the two layouts) fades out quickly or fades in late.
 */
export const morphStyle = (
  name: string | undefined,
  kind?: 'surface' | 'text' | 'extra',
) =>
  name === undefined
    ? undefined
    : {
        'view-transition-name': name,
        ...(kind ? { 'view-transition-class': `charity-${kind}` } : {}),
      }

// The view-transition-name of one part of the charity at `index` in the sidebar; none outside it.
const part = (index: number | undefined, name: string) =>
  index === undefined ? undefined : `charity-${index}-${name}`

/**
 * A charity in the extension's look: logo · name · raised, with the description and the socials below.
 * On mobile it's a row with a one-line description teaser and a chevron that opens in place (the teaser
 * fades out meanwhile); in the desktop sidebar it is always shown opened.
 */
export const CharityItem: Component<{
  item: CharityItemData
  /**
   * Position in the desktop sidebar: the charity is always shown opened (description and socials, no
   * chevron), and the sidebar morphs it into CharityItemClosed. Without it, the row opens on demand.
   */
  morph?: number
}> = (props) => {
  const description = () => props.item.donationData?.description

  const logo = () => (
    <span class="shrink-0" style={morphStyle(part(props.morph, 'logo'))}>
      <Avatar
        src={props.item.donationData?.logo}
        alt=""
        size="md"
        fallback={name(props.item)[0]}
      />
    </span>
  )
  const title = () => (
    <span
      class="block w-fit max-w-full truncate text-sm font-semibold"
      style={morphStyle(part(props.morph, 'name'), 'text')}
    >
      {name(props.item)}
    </span>
  )
  const raised = () => (
    <span class="text-raised flex shrink-0 flex-col items-end leading-tight font-bold">
      <span
        class="text-xxs"
        style={morphStyle(part(props.morph, 'label'), 'extra')}
      >
        Raised
      </span>
      <span style={morphStyle(part(props.morph, 'raised'), 'text')}>
        <RaisedValue class="text-sm" item={props.item.donationData?.raised} />
      </span>
    </span>
  )
  const details = () => (
    <div
      class="flex flex-col gap-1 px-2 pb-1"
      style={morphStyle(part(props.morph, 'details'), 'extra')}
    >
      <Show when={description()}>
        <p class="text-fg-muted text-xs whitespace-pre-line">{description()}</p>
      </Show>
      <Socials
        website={props.item.staticData.website}
        websites={props.item.staticData.websites}
      />
    </div>
  )

  return (
    <Show
      when={props.morph === undefined}
      fallback={
        <div
          class={cn(tileSurface, 'w-full pb-1')}
          style={morphStyle(part(props.morph, 'tile'), 'surface')}
        >
          <h3 class="flex items-center gap-3 p-2">
            {logo()}
            <span class="min-w-0 flex-1">{title()}</span>
            {raised()}
          </h3>
          {details()}
        </div>
      }
    >
      <Accordion collapsible class={cn(tileSurface, 'w-full')}>
        <Accordion.Item value="charity">
          <Accordion.Header as="h3">
            <Accordion.Trigger
              class={cn(
                focusRing,
                'group rounded-tile flex w-full items-center gap-3 p-2 text-left',
              )}
            >
              {logo()}
              <span class="min-w-0 flex-1">
                {title()}
                <Show when={description()}>
                  <span class="text-fg-muted block max-h-4 truncate text-xs transition-all duration-200 group-data-expanded:max-h-0 group-data-expanded:opacity-0 motion-reduce:transition-none">
                    {description()}
                  </span>
                </Show>
              </span>
              {raised()}
              <FaSolidChevronDown
                class="text-fg-muted size-3.5 shrink-0 transition-transform group-data-expanded:rotate-180"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={accordionContentMotion}>
            {details()}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Show>
  )
}

// Collapsed sidebar version: logo, short name and raised amount
export const CharityItemClosed: Component<{
  item: CharityItemData
  morph?: number
}> = (props) => (
  <div
    class={cn(tileSurface, 'flex flex-col items-center gap-1 p-2 text-center')}
    style={morphStyle(part(props.morph, 'tile'), 'surface')}
  >
    <span style={morphStyle(part(props.morph, 'logo'))}>
      <Avatar
        src={props.item.donationData?.logo}
        alt=""
        size="md"
        fallback={name(props.item)[0]}
      />
    </span>
    <p
      class="text-xxs leading-tight font-semibold"
      style={morphStyle(part(props.morph, 'name'), 'text')}
    >
      {props.item.staticData.name}
    </p>
    <span style={morphStyle(part(props.morph, 'raised'), 'text')}>
      <RaisedValue
        class="text-raised text-xxs font-bold"
        item={props.item.donationData?.raised}
      />
    </span>
  </div>
)

export const OverviewComponent: Component<{
  overview: Overview
  /** In the desktop sidebar, which morphs it into OverviewComponentClosed. */
  morph?: boolean
}> = (props) => {
  const isJJ = useIsJJ()
  const rows = () => [
    {
      label: 'Total',
      value: (
        <span
          style={morphStyle(props.morph ? 'charity-total' : undefined, 'text')}
        >
          <RaisedValue
            class="text-raised font-bold"
            item={props.overview.raised.total}
          />
        </span>
      ),
    },
    {
      label: 'Donations',
      value: isJJ() ? props.overview.donations : 0,
    },
    {
      label: 'Collections distributed',
      value: isJJ() ? props.overview.collections.redeemed : 0,
    },
  ]
  return (
    <div
      class={cn(tileSurface, 'flex flex-col gap-1.5 p-3')}
      style={morphStyle(
        props.morph ? 'charity-overview' : undefined,
        'surface',
      )}
    >
      <dl class="flex flex-col gap-1 text-sm">
        <For each={rows()}>
          {(row, index) => (
            // In the sidebar morph only the total travels; the labels and other rows are extras
            <div
              class="flex items-baseline justify-between gap-2"
              style={morphStyle(
                props.morph && index() > 0
                  ? `charity-overview-row-${index()}`
                  : undefined,
                'extra',
              )}
            >
              <dt
                class="text-fg-muted text-xs"
                style={morphStyle(
                  props.morph && index() === 0
                    ? 'charity-overview-label'
                    : undefined,
                  'extra',
                )}
              >
                {row.label}
              </dt>
              <dd class="text-raised font-bold tabular-nums">{row.value}</dd>
            </div>
          )}
        </For>
      </dl>
      <p
        class="text-fg-muted text-xxs"
        style={morphStyle(
          props.morph ? 'charity-overview-updated' : undefined,
          'extra',
        )}
      >
        Last update,{' '}
        {DateTime.fromJSDate(props.overview.date).toLocaleString(
          DateTime.DATETIME_MED,
        )}
      </p>
    </div>
  )
}

// Collapsed sidebar version: only the total raised
export const OverviewComponentClosed: Component<{
  overview: Overview
  morph?: boolean
}> = (props) => (
  <div
    class={cn(tileSurface, 'p-2 text-center')}
    style={morphStyle(props.morph ? 'charity-overview' : undefined, 'surface')}
  >
    <span style={morphStyle(props.morph ? 'charity-total' : undefined, 'text')}>
      <RaisedValue
        class="text-raised text-xs font-bold"
        item={props.overview.raised.total}
      />
    </span>
  </div>
)

const RaisedValue: Component<{ item?: Currencies; class?: string }> = (
  props,
) => {
  const { currency } = useCurrency()

  const value = () => {
    if (currency() === 'USD') {
      return props.item?.usd ?? 0
    }
    if (currency() === 'EUR') {
      return props.item?.euro ?? 0
    }
    return props.item?.gbp ?? 0
  }
  return (
    <Numeric
      class={props.class}
      value={value()}
      numberStyle="currency"
      currency={currency()}
    />
  )
}

const socialIcons = {
  discord: { label: 'Discord', Icon: DiscordIcon },
  twitter: { label: 'Twitter', Icon: TwitterIcon },
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  tiktok: { label: 'TikTok', Icon: TiktokIcon },
  youtube: { label: 'YouTube', Icon: YoutubeIcon },
  twitch: { label: 'Twitch', Icon: TwitchIcon },
} as const

const Socials: Component<{
  website?: string
  websites?: Partial<Record<keyof typeof socialIcons | 'facebook', string>>
}> = (props) => {
  const links = () => {
    const w = props.websites
    if (!w) return []
    return [
      ...(props.website
        ? [{ href: props.website, label: 'Website', Icon: FaSolidGlobe }]
        : []),
      ...(Object.keys(socialIcons) as (keyof typeof socialIcons)[])
        .filter((key) => w[key])
        .map((key) => ({ href: w[key]!, ...socialIcons[key] })),
    ]
  }
  return (
    <Show when={links().length > 0}>
      <div class="text-fg-muted -ml-1 flex flex-row flex-wrap items-center">
        <For each={links()}>
          {(link) => (
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              class={cn(
                'hover:text-fg rounded-full p-1 transition-colors hover:bg-black/5',
                focusRing,
              )}
            >
              <link.Icon class="size-3.5" />
            </a>
          )}
        </For>
      </div>
    </Show>
  )
}

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
 * A charity as a row in the extension's look: logo · name over a one-line description teaser · raised ·
 * chevron. It opens in place to the full description and the socials; the teaser fades out meanwhile.
 */
export const CharityItem: Component<{ item: CharityItemData }> = (props) => {
  const description = () => props.item.donationData?.description
  return (
    <Accordion collapsible class={cn(tileSurface, 'w-full')}>
      <Accordion.Item value="charity">
        <Accordion.Header as="h3">
          <Accordion.Trigger
            class={cn(
              focusRing,
              'group rounded-tile flex w-full items-center gap-3 p-2 text-left',
            )}
          >
            <Avatar
              src={props.item.donationData?.logo}
              alt=""
              size="md"
              fallback={name(props.item)[0]}
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">
                {name(props.item)}
              </span>
              <Show when={description()}>
                <span class="text-fg-muted block max-h-4 truncate text-xs transition-all duration-200 group-data-expanded:max-h-0 group-data-expanded:opacity-0 motion-reduce:transition-none">
                  {description()}
                </span>
              </Show>
            </span>
            <span class="text-raised flex shrink-0 flex-col items-end leading-tight font-bold">
              <span class="text-xxs">Raised</span>
              <RaisedValue
                class="text-sm"
                item={props.item.donationData?.raised}
              />
            </span>
            <FaSolidChevronDown
              class="text-fg-muted size-3.5 shrink-0 transition-transform group-data-expanded:rotate-180"
              aria-hidden="true"
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class={accordionContentMotion}>
          <div class="flex flex-col gap-1 px-2 pb-1">
            <Show when={description()}>
              <p class="text-fg-muted text-xs whitespace-pre-line">
                {description()}
              </p>
            </Show>
            <Socials
              website={props.item.staticData.website}
              websites={props.item.staticData.websites}
            />
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}

// Collapsed sidebar version: logo, short name and raised amount
export const CharityItemClosed: Component<{ item: CharityItemData }> = (
  props,
) => (
  <div
    class={cn(tileSurface, 'flex flex-col items-center gap-1 p-2 text-center')}
  >
    <Avatar
      src={props.item.donationData?.logo}
      alt=""
      size="md"
      fallback={name(props.item)[0]}
    />
    <p class="text-xxs leading-tight font-semibold">
      {props.item.staticData.name}
    </p>
    <RaisedValue
      class="text-raised text-xxs font-bold"
      item={props.item.donationData?.raised}
    />
  </div>
)

export const OverviewComponent: Component<{ overview: Overview }> = (props) => {
  const isJJ = useIsJJ()
  const rows = () => [
    {
      label: 'Total',
      value: (
        <RaisedValue
          class="text-raised font-bold"
          item={props.overview.raised.total}
        />
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
    <div class={cn(tileSurface, 'flex flex-col gap-1.5 p-3')}>
      <dl class="flex flex-col gap-1 text-sm">
        <For each={rows()}>
          {(row) => (
            <div class="flex items-baseline justify-between gap-2">
              <dt class="text-fg-muted text-xs">{row.label}</dt>
              <dd class="text-raised font-bold tabular-nums">{row.value}</dd>
            </div>
          )}
        </For>
      </dl>
      <p class="text-fg-muted text-xxs">
        Last update,{' '}
        {DateTime.fromJSDate(props.overview.date).toLocaleString(
          DateTime.DATETIME_MED,
        )}
      </p>
    </div>
  )
}

// Collapsed sidebar version: only the total raised
export const OverviewComponentClosed: Component<{ overview: Overview }> = (
  props,
) => (
  <div class={cn(tileSurface, 'p-2 text-center')}>
    <RaisedValue
      class="text-raised text-xs font-bold"
      item={props.overview.raised.total}
    />
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

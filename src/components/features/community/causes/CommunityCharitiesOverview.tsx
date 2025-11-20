import { type Component, For, Show } from 'solid-js'
import { useCommunityPage } from '../CommunityPageProvider.tsx'
import type {
  Currencies,
  JJCauseType,
  Overview,
} from '../../../../lib/orpc/private/jjData/contract.ts'
import './CommunityCharitiesOverview.css'
import {
  DiscordIcon,
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../../../common/icons/JJIcons.tsx'
import { Numeric } from 'solid-i18n'
import { DateTime } from 'luxon'
import {
  FaSolidArrowLeftLong,
  FaSolidArrowRightLong,
  FaSolidGlobe,
} from 'solid-icons/fa'
import { useIsJJ } from '../../../../lib/utils/jjDates.ts'
import type { CharityStatic } from '../../../../content/schema.ts' // Top-level subcomponents (do not define components inside other components)

// Top-level subcomponents (do not define components inside other components)
const RaisedValue: Component<{ item?: Currencies; class?: string }> = (
  props,
) => {
  const { currency } = useCommunityPage()
  const isJJ = useIsJJ()

  const value = () => {
    if (!isJJ()) {
      return 3_400_000.77
    }
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

const Socials: Component<{
  website?: string
  websites?: {
    discord?: string
    twitter?: string
    instagram?: string
    tiktok?: string
    facebook?: string
    youtube?: string
    twitch?: string
  }
}> = (p) => {
  const w = p.websites
  if (!w) return null as any
  const iconClass = 'h-4 w-4'
  // Hover helpers (use CreatorDialog.tsx as reference for hex values)
  const linkHoverColor = (type: string) => {
    switch (type) {
      case 'twitch':
        return 'hover:text-[#6441A4]'
      case 'youtube':
        return 'hover:text-[#FF0000]'
      case 'twitter':
        return 'hover:text-[#1DA1F2]'
      case 'tiktok':
        return 'hover:text-[#69C9D0]'
      case 'instagram':
        return 'hover:text-[#E4405F]'
      case 'discord':
        return 'hover:text-[#5865F2]'
      default:
        return 'hover:text-[#000000]'
    }
  }
  const linkBGHoverColor = (type: string) => {
    switch (type) {
      case 'twitch':
        return 'hover:bg-[#6441A4]/10'
      case 'youtube':
        return 'hover:bg-[#FF0000]/10'
      case 'twitter':
        return 'hover:bg-[#1DA1F2]/10'
      case 'tiktok':
        return 'hover:bg-[#69C9D0]/10'
      case 'instagram':
        return 'hover:bg-[#E4405F]/10'
      case 'discord':
        return 'hover:bg-[#5865F2]/10'
      default:
        return 'hover:bg-[#000000]/10'
    }
  }
  return (
    <div class="flex flex-row items-center gap-1 text-black/70">
      <Show when={p.website}>
        <a
          href={p.website!}
          target="_blank"
          rel="noreferrer"
          aria-label="Website"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('website')} ${linkBGHoverColor('website')}`}
        >
          <FaSolidGlobe class={iconClass} />
        </a>
      </Show>
      <Show when={w.discord}>
        <a
          href={w.discord!}
          target="_blank"
          rel="noreferrer"
          aria-label="Discord"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('discord')} ${linkBGHoverColor('discord')}`}
        >
          <DiscordIcon class={iconClass} />
        </a>
      </Show>
      <Show when={w.twitter}>
        <a
          href={w.twitter!}
          target="_blank"
          rel="noreferrer"
          aria-label="Twitter"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('twitter')} ${linkBGHoverColor('twitter')}`}
        >
          <TwitterIcon class={iconClass} />
        </a>
      </Show>
      <Show when={w.instagram}>
        <a
          href={w.instagram!}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('instagram')} ${linkBGHoverColor('instagram')}`}
        >
          <InstagramIcon class={iconClass} />
        </a>
      </Show>
      <Show when={w.tiktok}>
        <a
          href={w.tiktok!}
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('tiktok')} ${linkBGHoverColor('tiktok')}`}
        >
          <TiktokIcon class={iconClass} />
        </a>
      </Show>
      <Show when={w.youtube}>
        <a
          href={w.youtube!}
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('youtube')} ${linkBGHoverColor('youtube')}`}
        >
          <YoutubeIcon class={iconClass} />
        </a>
      </Show>
      <Show when={w.twitch}>
        <a
          href={w.twitch!}
          target="_blank"
          rel="noreferrer"
          aria-label="Twitch"
          class={`rounded-full p-1 transition-colors ${linkHoverColor('twitch')} ${linkBGHoverColor('twitch')}`}
        >
          <TwitchIcon class={iconClass} />
        </a>
      </Show>
    </div>
  )
}

export const CommunityCharitiesOverview: Component = () => {
  const { mergedCharityItems, overview, charityOpen, setCharityOpen } =
    useCommunityPage()

  const containerWidth = () => (charityOpen() ? 'w-[280px]' : 'w-[96px]')

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div
        class={`flex flex-col items-stretch justify-start gap-2 ${containerWidth()}`}
      >
        <Toggle />
        <Show when={overview.data}>
          {(ov) => (
            <Show
              when={charityOpen()}
              fallback={<OverviewComponentClosed overview={ov()} />}
            >
              <OverviewComponent overview={ov()} />
            </Show>
          )}
        </Show>
        <For each={mergedCharityItems()}>
          {(it) => (
            <Show
              when={charityOpen()}
              fallback={<CharityItemClosed item={it} />}
            >
              <CharityItem item={it} />
            </Show>
          )}
        </For>
      </div>
    </Show>
  )
}

// Mobile-only simplified charities overview: shows the overview at the top
// and then a list/grid of CharityItem components. No toggle/collapse.
export const CommunityCharitiesOverviewMobile: Component = () => {
  const { mergedCharityItems, overview } = useCommunityPage()

  return (
    <Show when={mergedCharityItems().length > 0}>
      <div class={"flex w-full flex-col items-stretch justify-start gap-2"}>
        <Show when={overview.data}>{(ov) => <OverviewComponent overview={ov()} />}</Show>
        <div class={"grid w-full grid-cols-1 gap-2 sm:grid-cols-2"}>
          <For each={mergedCharityItems()}>{(it) => <CharityItem item={it} />}</For>
        </div>
      </div>
    </Show>
  )
}

const Toggle: Component = () => {
  const { charityOpen, setCharityOpen } = useCommunityPage()
  return (
    <div class={'flex items-start justify-start'}>
      <p class={'sr-only'}>Charities Overview</p>
      <button
        type="button"
        aria-label={
          charityOpen()
            ? 'Collapse charities overview'
            : 'Expand charities overview'
        }
        class={
          'flex flex-row gap-2 items-start justify-center rounded-lg bg-gradient-to-b from-neutral-50 to-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 shadow ring-1 ring-black/5 transition hover:brightness-105'
        }
        onClick={() => setCharityOpen(!charityOpen())}
      >
        <Show when={charityOpen()} fallback={<FaSolidArrowRightLong />}>
          <FaSolidArrowLeftLong />
        </Show>
        <Show when={charityOpen()} fallback={<p>Open</p>}>
          <p>Close</p>
        </Show>
      </button>
    </div>
  )
}

const CharityItem: Component<{
  item: {
    donationData?: JJCauseType
    staticData: CharityStatic
  }
}> = (props) => {
  const it = props.item
  return (
    <div class="inline-block h-[96px] w-full">
      <div class="hover:scale-101 flex h-full w-full items-center gap-3 rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 text-black shadow hover:brightness-105">
        <img
          src={it.donationData?.logo}
          alt={it.donationData?.name || it.staticData.name}
          class="h-12 w-12 flex-shrink-0 rounded object-cover"
          loading="lazy"
        />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold text-black">
            {it.donationData?.name || it.staticData.name}
          </div>
          <RaisedValue
            class={'font-bold text-primary-600'}
            item={it.donationData?.raised}
          />
          <Socials
            website={it.staticData.website}
            websites={it.staticData.websites}
          />
        </div>
      </div>
    </div>
  )
}

// Closed (collapsed) version of the charity item: smaller icon with raised amount below
const CharityItemClosed: Component<{
  item: { donationData?: JJCauseType; staticData: CharityStatic }
}> = (props) => {
  const it = props.item
  return (
    <div class="inline-block w-full">
      <div class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 text-black shadow hover:brightness-105">
        <img
          src={it.donationData?.logo}
          alt={it.donationData?.name || it.staticData.name}
          class="h-10 w-10 flex-shrink-0 rounded object-cover"
          loading="lazy"
        />
        <p class={'text-center text-xxs font-semibold'}>{it.staticData.name}</p>
        <RaisedValue
          class={'text-center text-xxs font-bold text-primary-600'}
          item={it.donationData?.raised}
        />
      </div>
    </div>
  )
}

const OverviewComponent: Component<{ overview: Overview }> = (props) => {
  const isJJ = useIsJJ()
  return (
    <div class="flex w-full flex-col items-start justify-start gap-2 rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 text-primary-600 hover:brightness-105">
      <table class="w-full">
        <tbody>
          <tr>
            <td class="align-middle text-xs text-black">Total</td>
            <td class="text-right align-middle">
              <RaisedValue
                class={'font-bold text-primary-600'}
                item={props.overview.raised.total}
              />
            </td>
          </tr>
          <tr>
            <td class="align-middle text-xs text-black">Donations</td>
            <td class="text-right align-middle">
              <p class={'font-bold text-primary-600'}>
                {isJJ() ? props.overview.donations : 0}
              </p>
            </td>
          </tr>
          <tr>
            <td class="align-middle text-xs text-black">
              Collections Distributed
            </td>
            <td class="text-right align-middle">
              <p class={'font-bold text-primary-600'}>
                {isJJ() ? props.overview.collections.redeemed : 0}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <p class={'text-xs text-black'}>
        Last update,{' '}
        {DateTime.fromJSDate(props.overview.date).toLocaleString(
          DateTime.DATETIME_MED,
        )}
      </p>
    </div>
  )
}

// Closed (collapsed) version: only show total raised
const OverviewComponentClosed: Component<{ overview: Overview }> = (props) => {
  return (
    <div class="flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 text-primary-600 hover:brightness-105">
      <RaisedValue
        class={'text-center text-xs font-bold text-primary-600'}
        item={props.overview.raised.total}
      />
    </div>
  )
}

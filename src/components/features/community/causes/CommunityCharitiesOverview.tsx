import {
  type Component,
  createMemo,
  createSignal,
  For,
  Match,
  Switch,
} from 'solid-js'
import { useCommunityPage } from '../CommunityPageProvider.tsx'
import type { CharitiesStatic } from '../../../../content/schema.ts'
import type { JJCauseType } from '../../../../lib/orpc/private/jjData/contract.ts'
import './CommunityCharitiesOverview.css'
import {
  DiscordIcon,
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from '../../../common/icons/JJIcons.tsx'

// Top-level subcomponents (do not define components inside other components)
const Raised: Component<{ item?: JJCauseType }> = (p) => {
  const f = p.item?.raised?.gbpFormatted
  if (!f) return null as any
  return <span class="text-sm text-black/80">{f}</span>
}

const Socials: Component<{
  website?: {
    discord?: string
    twitter?: string
    instagram?: string
    tiktok?: string
    facebook?: string
    youtube?: string
    twitch?: string
  }
}> = (p) => {
  const w = p.website
  if (!w) return null as any
  const iconClass = 'h-4 w-4'
  return (
    <div class="mt-1 flex flex-row items-center gap-2 text-black/70">
      <Switch>
        <Match when={w.discord}>
          <a
            href={w.discord!}
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
          >
            <DiscordIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
      <Switch>
        <Match when={w.twitter}>
          <a
            href={w.twitter!}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter"
          >
            <TwitterIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
      <Switch>
        <Match when={w.instagram}>
          <a
            href={w.instagram!}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <InstagramIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
      <Switch>
        <Match when={w.tiktok}>
          <a
            href={w.tiktok!}
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <TiktokIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
      <Switch>
        <Match when={w.youtube}>
          <a
            href={w.youtube!}
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
          >
            <YoutubeIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
      <Switch>
        <Match when={w.twitch}>
          <a
            href={w.twitch!}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitch"
          >
            <TwitchIcon class={iconClass} />
          </a>
        </Match>
      </Switch>
    </div>
  )
}

interface CommunityCharitiesOverviewProps {
  charitiesData?: CharitiesStatic
}

export const CommunityCharitiesOverview: Component<
  CommunityCharitiesOverviewProps
> = (props) => {
  const [paused, setPaused] = createSignal(false)
  const { cause } = useCommunityPage()

  const mergedData = () => {
    const c = cause.data
    if (!c) {
      return []
    }
    const map = new Map<string, JJCauseType>(c.causes.map((c) => [c.id, c]))
    return (
      props.charitiesData?.charities.map((c) => {
        return {
          donationData: map.get(c.tiltify_id),
          staticData: c,
        }
      }) ?? []
    )
  }

  const displayItems = createMemo(() => {
    const list =
      mergedData() ??
      props.charitiesData?.charities?.map((c) => ({
        donationData: undefined as JJCauseType | undefined,
        staticData: c,
      }))
    if (!list || list.length === 0) return [] as typeof list
    // Duplicate items to create a seamless marquee effect
    const repeat = Math.max(2, Math.ceil(24 / list.length))
    return Array.from({ length: repeat }, () => list).flat()
  })

  const speed = createMemo(() => Math.max(40, displayItems().length * 6))

  return (
    <div
      class="community-charities-overview relative flex overflow-x-hidden"
      classList={{ paused: paused() }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusIn={() => setPaused(true)}
      onFocusOut={() => setPaused(false)}
    >
      <div
        class="marquee-track marquee-1 flex flex-row whitespace-nowrap"
        style={{
          '--marquee-duration': `${speed()}s`,
        }}
      >
        <For each={displayItems()}>
          {(it) => {
            const img = it.donationData?.logo ?? ''
            return (
              <div class="inline-block h-[96px] w-[240px] px-3 py-2">
                <div class="hover:scale-101 flex h-full w-full items-center gap-3 rounded-md bg-gradient-to-b from-neutral-50 to-neutral-100 p-2 text-black shadow hover:brightness-105">
                  <img
                    src={img}
                    alt={it.donationData?.name || it.staticData.name}
                    class="h-12 w-12 flex-shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-semibold text-black">
                      {it.donationData?.name || it.staticData.name}
                    </div>
                    <Raised item={it.donationData} />
                    <Socials website={it.staticData.websites} />
                  </div>
                </div>
              </div>
            )
          }}
        </For>
      </div>
      <div
        class="marquee-track marquee-2 absolute top-0 flex flex-row whitespace-nowrap"
        style={{
          '--marquee-duration': `${speed()}s`,
        }}
      >
        <For each={displayItems()}>
          {(it) => {
            const img = it.donationData?.logo || ''
            return (
              <div class="inline-block h-[96px] w-[320px] px-3 py-2">
                <div class="flex h-full w-full items-center gap-3 rounded-md bg-white p-2 text-black shadow">
                  <img
                    src={img}
                    alt={it.donationData?.name || it.staticData.name}
                    class="h-12 w-12 flex-shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-semibold text-black">
                      {it.donationData?.name || it.staticData.name}
                    </div>
                    <Raised item={it.donationData} />
                    <Socials website={it.staticData.websites} />
                  </div>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

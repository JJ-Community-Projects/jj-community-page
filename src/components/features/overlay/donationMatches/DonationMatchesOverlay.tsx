import { type Component, For, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { twMerge } from 'tailwind-merge'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { TwitchIcon } from '../../../common/icons/JJIcons.tsx'
import { BG_PRESETS, type BgPreset } from './presets.ts'
import { DEMO_MATCHES } from './demoData.ts'

export type DonationMatchesOverlayProps = {
  bg?: BgPreset
  demo?: boolean
}

// Fetches the 5 most recent active donation matches. Each row shows the
// channel avatar, campaign name and a symbolic Twitch glyph + handle (OBS
// overlays are non-interactive, so the channel URL is never shown as a link).
// `demo` swaps the query for static fixtures so the editor preview is always
// populated.
const Body: Component<DonationMatchesOverlayProps> = (props) => {
  const demo = props.demo ?? false
  const preset = BG_PRESETS[props.bg ?? 'red']

  const q = useQuery(() =>
    orpcPrivate.overlay.donationMatches.queryOptions({
      input: { limit: 5 },
      enabled: !demo,
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: false,
      placeholderData: (prev) => prev,
    }),
  )

  const matches = () => (demo ? DEMO_MATCHES : (q.data?.matches ?? []))

  return (
    <div
      class={twMerge(
        'flex min-h-screen w-full flex-col gap-3 p-4',
        preset.text,
      )}
      style={{ background: preset.background }}
    >
      <p class={'text-center text-3xl font-bold'}>Active Dono Matches</p>
      <Show
        when={matches().length > 0}
        fallback={
          <p class={'text-center text-lg opacity-80'}>
            No active donation matches
          </p>
        }
      >
        <ul class={'flex w-full flex-col gap-2'}>
          <For each={matches()}>
            {(match) => (
              <li
                class={
                  'flex flex-row items-center gap-3 rounded-2xl bg-black/20 px-3 py-2 shadow'
                }
              >
                <Show when={match.avatar}>
                  <img
                    src={match.avatar}
                    alt={match.twitchName ?? match.campaignName}
                    class={
                      'size-6 shrink-0 rounded-full object-cover ring-2 ring-white/25'
                    }
                  />
                </Show>
                <span class={'min-w-0 flex-1 truncate font-semibold'}>
                  {match.campaignName}
                </span>
                {/* Symbolic only — OBS overlays are not interactive, so no
                    anchor and no raw URL; icon + handle identify the channel. */}
                <span
                  class={
                    'flex shrink-0 flex-row items-center gap-1.5 opacity-90'
                  }
                >
                  {/* TwitchIcon pins `color: currentcolor` inline, so it
                      always inherits the preset text colour. */}
                  <TwitchIcon class={'size-4'} />
                  <span class={'font-medium'}>
                    {/* `twitchName` is optional upstream; stripping the host
                        keeps a raw URL off the overlay in that case. */}
                    {match.twitchName ??
                      match.channelUrl
                        .replace(/^.*twitch\.tv\//i, '')
                        .replace(/\/+$/, '')}
                  </span>
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}

export const DonationMatchesOverlay: Component<DonationMatchesOverlayProps> = (
  props,
) => (
  <QueryClientProvider client={new QueryClient()}>
    <Body {...props} />
  </QueryClientProvider>
)

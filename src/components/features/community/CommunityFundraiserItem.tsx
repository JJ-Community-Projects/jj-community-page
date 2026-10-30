import { type Component, For, Show } from 'solid-js'
import { FaSolidUser } from 'solid-icons/fa'
import type { CommunityFundraiser } from '../../../lib/orpc/private/jjData/contract.ts'
import { TiltifyIcon, TwitchIcon } from '../../common/icons/JJIcons.tsx'
import { Avatar } from '../../ui/Avatar'
import { IconButton } from '../../ui/Button'
import { cn, tileSurface } from '../../ui/cn'
import { Chip, LiveBadge, Raised } from '../../ui/Labels'
import { type Currency, Money, raisedIn } from './Money.tsx'

// A dono-matching fundraiser fills the tile in primary, like the extension's dono match card; the
// white ring keeps it apart from the red canvas.
const donoMatchSurface =
  'rounded-tile bg-primary-600 text-white shadow-tile ring-2 ring-white'

// Live: the neutral tile with a white ring (a primary ring vanishes on the canvas).
const liveSurface = cn(tileSurface, 'ring-2 ring-white')

// Smaller than IconButton's `sm`, so three fit next to the raised amount
const buttonSize = 'size-7'

/**
 * One fundraiser of the unified community list (`jj.communityList`): a campaign, an account holder,
 * or both. Not a link itself; small buttons link to Tiltify, the profile and Twitch.
 * Shared by /community and /community/ssr; each page passes its own currency.
 */
export const CommunityFundraiserItem: Component<{
  fundraiser: CommunityFundraiser
  currency: Currency
}> = (props) => {
  const f = () => props.fundraiser
  const dono = () => f().hasActiveDonationMatch

  return (
    <div
      class={cn(
        dono() ? donoMatchSurface : f().isLive ? liveSurface : tileSurface,
        'flex min-w-0 flex-col gap-2 p-2.5',
      )}
    >
      <div class="flex min-w-0 items-start gap-2.5">
        <Avatar src={f().avatar} alt="" size="md" fallback={f().name[0]} />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <p class="flex min-w-0 items-center gap-1.5">
            <span class="truncate text-sm font-semibold">{f().name}</span>
            <Show when={f().isLive}>
              <LiveBadge
                class={cn('shrink-0', dono() && 'ring-1 ring-white')}
              />
            </Show>
          </p>
          <Show when={dono()}>
            <p class="text-xxs font-bold">Dono Matching</p>
          </Show>
          <Show when={f().charity}>
            {(charity) => (
              <p
                class={cn(
                  'flex min-w-0 items-center gap-1 text-xs',
                  dono() ? 'text-white/85' : 'text-fg-muted',
                )}
              >
                <img
                  src={charity().logo}
                  alt=""
                  loading="lazy"
                  class="size-4 shrink-0 rounded-sm bg-white object-contain"
                />
                <span class="truncate">{charity().name}</span>
              </p>
            )}
          </Show>
        </div>
      </div>

      <Show when={f().tags.length > 0}>
        <div class="flex min-w-0 gap-1 overflow-hidden">
          <For each={f().tags.slice(0, 3)}>
            {(tag) => (
              <Chip size="sm" color={tag.color} class="min-w-0">
                {tag.name}
              </Chip>
            )}
          </For>
        </div>
      </Show>

      {/* Raised sits next to the buttons, so the top row keeps its width for the name (3 tiles per row) */}
      <div class="mt-auto flex min-w-0 items-end justify-between gap-2">
        <Show
          when={f().raised}
          fallback={
            <p
              class={cn(
                'self-center text-xs',
                dono() ? 'text-white/85' : 'text-fg-muted',
              )}
            >
              No campaign yet
            </p>
          }
        >
          {(raised) => (
            <Raised class={cn('min-w-0 items-start', dono() && 'text-white')}>
              <Money
                value={raisedIn(raised(), props.currency)}
                currency={props.currency}
              />
            </Raised>
          )}
        </Show>
        <div class="flex shrink-0 gap-1">
          <IconButton
            href={f().tiltifyUrl}
            target="_blank"
            rel="noopener"
            brand="tiltify"
            size="sm"
            class={buttonSize}
            aria-label={`${f().name} on Tiltify`}
          >
            <TiltifyIcon class="size-3" />
          </IconButton>
          <Show when={f().profileUrl}>
            {(url) => (
              <IconButton
                href={url()}
                size="sm"
                class={buttonSize}
                aria-label={`Profile of ${f().name}`}
              >
                <FaSolidUser class="size-2.5" aria-hidden="true" />
              </IconButton>
            )}
          </Show>
          <Show when={f().twitchUrl}>
            {(url) => (
              <IconButton
                href={url()}
                target="_blank"
                rel="noopener"
                brand="twitch"
                size="sm"
                class={buttonSize}
                aria-label={
                  f().isLive
                    ? `Watch ${f().name} live on Twitch`
                    : `${f().name} on Twitch`
                }
              >
                <TwitchIcon class="size-3" />
              </IconButton>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}

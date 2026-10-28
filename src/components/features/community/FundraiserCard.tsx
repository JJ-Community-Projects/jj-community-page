import { type Component, createSignal, For, onMount, Show } from 'solid-js'
import { useLocale } from '@kobalte/core'
import { FaSolidCalendarWeek, FaSolidHeart } from 'solid-icons/fa'
import type {
  Currencies,
  JJCampaignType,
} from '../../../lib/orpc/private/jjData/contract.ts'
import {
  TiltifyIcon,
  TwitchIcon,
  YoutubeIcon,
} from '../../common/icons/JJIcons.tsx'
import { Avatar } from '../../ui/Avatar'
import { Button, IconButton } from '../../ui/Button'
import { cn, focusRing, tileSurface } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'
import { Chip, LiveBadge, Raised } from '../../ui/Labels'

export type Currency = 'GBP' | 'USD' | 'EUR'

export const raisedIn = (raised: Currencies | undefined, currency: Currency) =>
  currency === 'USD'
    ? (raised?.usd ?? 0)
    : currency === 'EUR'
      ? (raised?.euro ?? 0)
      : (raised?.gbp ?? 0)

/**
 * A currency amount. Server-rendered as en-US (solid-i18n's Numeric is client-only and /community/ssr
 * renders this on the server), then switched to the viewer's locale once mounted.
 */
export const Money: Component<{ value: number; currency: Currency }> = (
  props,
) => {
  const locale = useLocale()
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const text = () =>
    new Intl.NumberFormat(mounted() ? locale.locale() : 'en-US', {
      style: 'currency',
      currency: props.currency,
    }).format(props.value)
  return <>{text()}</>
}

/**
 * A community fundraiser in the extension's row layout: avatar · name + one line · raised, plus a
 * Donate button. The row opens a details dialog with the description, tags and all links.
 * Shared by /community and /community/ssr; each page passes its own currency.
 */
export const FundraiserCard: Component<{
  campaign: JJCampaignType
  currency: Currency
}> = (props) => {
  const [open, setOpen] = createSignal(false)
  const c = () => props.campaign
  const subline = () =>
    c().campaignName && c().campaignName !== c().tiltifyName
      ? c().campaignName
      : c().tiltifyDescription
  const raised = () => (
    <Money
      value={raisedIn(c().raised, props.currency)}
      currency={props.currency}
    />
  )

  return (
    <div class={cn(tileSurface, 'flex items-center gap-1 p-1.5')}>
      <button
        type="button"
        class={cn(
          'rounded-group flex min-w-0 flex-1 items-center gap-2 p-1 text-left transition-colors hover:bg-black/5',
          focusRing,
        )}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Avatar
          src={c().avatar}
          alt=""
          size="md"
          fallback={c().tiltifyName[0]}
        />
        <div class="min-w-0 flex-1">
          <p class="flex min-w-0 items-center gap-1.5">
            <span class="truncate text-sm font-semibold">
              {c().tiltifyName}
            </span>
            <Show when={c().isTwitchLive}>
              <LiveBadge class="shrink-0" />
            </Show>
          </p>
          <Show when={subline()}>
            <p class="text-fg-muted truncate text-xs">{subline()}</p>
          </Show>
        </div>
        <Raised class="shrink-0">{raised()}</Raised>
      </button>
      <IconButton
        href={c().tiltifyUrl}
        target="_blank"
        rel="noopener"
        variant="primary"
        size="sm"
        aria-label={`Donate to ${c().tiltifyName}`}
      >
        <FaSolidHeart class="size-3.5" aria-hidden="true" />
      </IconButton>

      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title={c().tiltifyName}
        description={subline()}
        footer={
          <>
            <Show when={c().scheduleUrl}>
              {(url) => (
                <Button href={url()} size="sm" variant="accent">
                  <FaSolidCalendarWeek class="size-3" aria-hidden="true" />
                  Schedule
                </Button>
              )}
            </Show>
            <Show when={c().youtube}>
              {(url) => (
                <Button href={url()} target="_blank" size="sm" brand="youtube">
                  <YoutubeIcon class="size-3.5" />
                  YouTube
                </Button>
              )}
            </Show>
            <Show when={c().twitch}>
              {(url) => (
                <Button href={url()} target="_blank" size="sm" brand="twitch">
                  <TwitchIcon class="size-3.5" />
                  Twitch
                </Button>
              )}
            </Show>
            <Button
              href={c().tiltifyUrl}
              target="_blank"
              size="sm"
              variant="primary"
            >
              <TiltifyIcon class="size-3.5" />
              Donate
            </Button>
          </>
        }
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <Avatar
              src={c().avatar}
              alt=""
              size="lg"
              fallback={c().tiltifyName[0]}
            />
            <div class="flex flex-col gap-1">
              <Show when={c().isTwitchLive}>
                <LiveBadge label="Live on Twitch" />
              </Show>
              <Raised size="md" class="items-start">
                {raised()}
              </Raised>
            </div>
          </div>
          <Show when={c().tiltifyDescription}>
            <p class="text-fg-muted text-sm whitespace-pre-line">
              {c().tiltifyDescription}
            </p>
          </Show>
          <Show when={c().tags.length > 0}>
            <div class="flex flex-wrap gap-1">
              <For each={c().tags}>
                {(tag) => (
                  <Chip size="sm" color={tag.color}>
                    {tag.name}
                  </Chip>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Dialog>
    </div>
  )
}

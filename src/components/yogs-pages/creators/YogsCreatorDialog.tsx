import type { ModalSignal } from '../../../lib/createModalSignal.ts'
import { type Component, For, type JSX, Show } from 'solid-js'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import {
  FaBrandsDiscord,
  FaBrandsInstagram,
  FaBrandsTiktok,
  FaBrandsTwitch,
  FaBrandsTwitter,
  FaBrandsYoutube,
} from 'solid-icons/fa'
import { BskyIcon, JJIcon } from '../../common/icons/JJIcons.tsx'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'
import { Dialog } from '../../ui/Dialog'
import { Button } from '../../ui/Button'
import { Avatar } from '../../ui/Avatar'
import { CREATOR_FALLBACK_COLOR } from './YogsCreatorChip.tsx'

interface CreatorDialogProps {
  creator: YogsCreator
  modalSignal: ModalSignal
  /** "Show N streams": filters the schedule to this creator; shown only when set. */
  onJJStreamsClick?: () => void
  /** The creator's streams in this schedule, for the button label. */
  streamCount?: number
}

const groupLabel = (type: string) => {
  if (type === 'best_of') return 'Best of'
  if (type === 'friend') return 'Friend'
  return 'Yogs'
}

// Same order as before; a brand colour where the Button has one
const LINKS: Record<
  string,
  {
    label: string
    icon: () => JSX.Element
    brand?: 'twitch' | 'youtube' | 'bluesky' | 'discord'
  }
> = {
  twitch: { label: 'Twitch', icon: () => <FaBrandsTwitch />, brand: 'twitch' },
  youtube: { label: 'YouTube', icon: () => <FaBrandsYoutube />, brand: 'youtube' },
  bsky: { label: 'Bluesky', icon: () => <BskyIcon class="size-3.5" />, brand: 'bluesky' },
  discord: { label: 'Discord', icon: () => <FaBrandsDiscord />, brand: 'discord' },
  tiktok: { label: 'TikTok', icon: () => <FaBrandsTiktok /> },
  instagram: { label: 'Instagram', icon: () => <FaBrandsInstagram /> },
  twitter: { label: 'X', icon: () => <FaBrandsTwitter /> },
}
const LINK_ORDER = Object.keys(LINKS)

export const YogsCreatorDialog: Component<CreatorDialogProps> = (props) => {
  const color = () => props.creator.color ?? CREATOR_FALLBACK_COLOR
  const links = () =>
    (props.creator.links ?? [])
      .filter((link) => link.type && LINK_ORDER.includes(link.type))
      .sort((a, b) => LINK_ORDER.indexOf(a.type!) - LINK_ORDER.indexOf(b.type!))

  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
      title={props.creator.name}
      description={groupLabel(props.creator.type)}
      size="sm"
      accent={{ background: color(), color: getTextColor(color()) }}
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <Avatar
            src={props.creator.imageUrl}
            alt={props.creator.name}
            size="lg"
            shape="circle"
            ringColor={color()}
          />
          <Show
            when={links().length > 0}
            fallback={<p class="text-fg-muted text-sm">No links found</p>}
          >
            <div class="flex flex-wrap gap-2">
              <For each={links()}>
                {(link) => {
                  const meta = LINKS[link.type!]
                  return (
                    <Button
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      brand={meta.brand}
                      aria-label={`${props.creator.name} on ${meta.label}`}
                    >
                      {meta.icon()}
                      {meta.label}
                    </Button>
                  )
                }}
              </For>
            </div>
          </Show>
        </div>
        <Show when={props.onJJStreamsClick}>
          <Button
            variant="primary"
            class="w-full"
            onClick={() => props.onJJStreamsClick?.()}
          >
            <JJIcon class="size-5" />
            {props.streamCount
              ? `Show ${props.creator.name}'s ${props.streamCount} streams`
              : 'Show Jingle Jam streams'}
          </Button>
        </Show>
      </div>
    </Dialog>
  )
}

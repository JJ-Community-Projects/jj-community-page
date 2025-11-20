import type { ModalSignal } from '../../../lib/createModalSignal.ts'
import { type Component, For, Show } from 'solid-js'
import { Dialog } from '@kobalte/core/dialog'
import { getTextColor } from '../../../lib/utils/textColors.ts'
import {
  FaBrandsDiscord,
  FaBrandsInstagram,
  FaBrandsPatreon,
  FaBrandsReddit,
  FaBrandsTiktok,
  FaBrandsTwitch,
  FaBrandsTwitter,
  FaBrandsYoutube,
  FaSolidLink,
  FaSolidXmark,
} from 'solid-icons/fa'
import { twMerge } from 'tailwind-merge'
import { BskyIcon, JJIcon } from '../../common/icons/JJIcons.tsx'
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'

interface CreatorDialogProps {
  creator: YogsCreator
  modalSignal: ModalSignal
  onJJStreamsClick?: () => void
}

export const YogsCreatorDialog: Component<CreatorDialogProps> = (props) => {
  return (
    <Dialog
      open={props.modalSignal.isOpen()}
      onOpenChange={props.modalSignal.setOpen}
    >
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 p-2 lg:p-16" />
        <Dialog.Content class="fixed left-1/2 top-1/2 w-[calc(100vw_-_24px)] -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white shadow-xl lg:w-[min(calc(100vw_-_16px),_386px)]">
          <Dialog.Title
            class="flex flex-row gap-4 rounded-t-2xl p-2"
            style={{
              background: props.creator.color ?? '#1E95EF',
              color: getTextColor(props.creator.color ?? '#1E95EF'),
            }}
          >
            <button
              class={'aspect-square rounded-full hover:bg-accent-200/10'}
              onClick={() => props.modalSignal.close()}
            >
              <FaSolidXmark size={24} />
            </button>
            <div class={'flex flex-col'}>
              <p class={'text-xl font-bold'}>{props.creator.name}</p>
            </div>
          </Dialog.Title>
          <Show when={props.creator.links}>
            <div class={'flex items-center justify-center p-4'}>
              <Links
                creator={props.creator}
                onJJStreamsClick={props.onJJStreamsClick}
              />
            </div>
          </Show>
          <Show when={!props.creator.links}>
            <div class={'flex items-center justify-center p-4'}>
              <p>No Links found</p>
            </div>
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

interface LinksProps {
  creator: YogsCreator
  onJJStreamsClick?: () => void
}

export const Links: Component<LinksProps> = (props) => {
  const links = props.creator.links!

  const linkOrder = [
    'twitch',
    'youtube',
    'bsky',
    'discord',
    'tiktok',
    'instagram',
    'twitter',
  ]

  const filteredLinks = links
    .filter((link) => link.type)
    .filter((link) => linkOrder.includes(link.type!))

  filteredLinks.sort((a, b) => {
    return linkOrder.indexOf(a.type!) - linkOrder.indexOf(b.type!)
  })



  const linkHoverColor = (type: string) => {
    switch (type) {
      case 'twitch':
        return 'hover:text-[#6441A4]'
      case 'youtube':
        return 'hover:text-[#FF0000]'
      case 'bsky':
        return 'hover:text-[#1E95EF]'
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
      case 'bsky':
        return 'hover:bg-[#1E95EF]/10'
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

  const linkIcon = (type: string) => {
    switch (type) {
      case 'twitch':
        return <FaBrandsTwitch size={24} />
      case 'youtube':
        return <FaBrandsYoutube size={24} />
      case 'bsky':
        return <BskyIcon class={'size-6'} />
      case 'twitter':
        return <FaBrandsTwitter size={24} />
      case 'tiktok':
        return <FaBrandsTiktok size={24} />
      case 'instagram':
        return <FaBrandsInstagram size={24} />
      case 'discord':
        return <FaBrandsDiscord size={24} />
      case 'reddit':
        return <FaBrandsReddit size={24} />
      case 'patreon':
        return <FaBrandsPatreon size={24} />
      case 'website':
        return <FaSolidLink size={24} />
      default:
        return <FaSolidLink size={24} />
    }
  }

  return (
    <div class={'flex w-full flex-col gap-4'}>
      <div class={'flex flex-row flex-wrap justify-center gap-2'}>
        <For each={filteredLinks}>
          {(link) => (
            <a
              href={link.url}
              target={'_blank'}
              class={twMerge(
                'rounded-full p-2 transition-all',
                linkHoverColor(link.type!),
                linkBGHoverColor(link.type!),
              )}
              aria-label={`${props.creator.name} ${link.type}`}
            >
              {linkIcon(link.type!)}
            </a>
          )}
        </For>
      </div>
      <Show when={props.onJJStreamsClick}>
        <button
          class={
            'flex flex-row items-center justify-center gap-2 rounded-full bg-primary p-2 text-white transition-all hover:bg-primary-400'
          }
          onClick={() => props.onJJStreamsClick?.()}
        >
          <JJIcon class={'size-6'} />
          <span>Show Jingle Jam Streams</span>
        </button>
      </Show>
    </div>
  )
}

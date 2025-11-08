import type {ModalSignal} from "../../../lib/createModalSignal.ts";
import {type Component, For, Match, Show, Switch} from "solid-js";
import {Dialog} from "@kobalte/core/dialog";
import {getTextColor} from "../../../lib/utils/textColors.ts";
import {FaSolidXmark} from "solid-icons/fa";
import {twMerge} from "tailwind-merge";
import {
  FaBrandsDiscord,
  FaBrandsInstagram,
  FaBrandsPatreon,
  FaBrandsReddit,
  FaBrandsTiktok,
  FaBrandsTwitch,
  FaBrandsTwitter,
  FaBrandsYoutube,
  FaSolidLink
} from "solid-icons/fa";
import {BskyIcon, JJIcon} from "../common/YogsJJIcons.tsx";
import type { YogsCreator } from '../../../lib/orpc/private/yogs/contract.ts'

interface CreatorDialogProps {
  creator: YogsCreator,
  modalSignal: ModalSignal,
  onJJStreamsClick?: () => void
}

export const YogsCreatorDialog: Component<CreatorDialogProps> = (props) => {
  return (
    <Dialog open={props.modalSignal.isOpen()} onOpenChange={props.modalSignal.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/20 lg:p-16 p-2"/>
        <Dialog.Content
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[calc(100vw_-_24px)] lg:w-[min(calc(100vw_-_16px),_386px)]">
          <Dialog.Title
            class="p-2 flex flex-row gap-4 rounded-t-2xl"
            style={{
              background: props.creator.color?? '#1E95EF',
              color: getTextColor(props.creator.color ?? '#1E95EF')
            }}
          >
            <button class={'rounded-full hover:bg-accent-200/10 aspect-square'}
                    onClick={() => props.modalSignal.close()}>
              <FaSolidXmark size={24}/>
            </button>
            <div class={'flex flex-col'}>
              <p class={'text-xl font-bold'}>{props.creator.name}</p>
            </div>
          </Dialog.Title>
          <Show when={props.creator.links}>
            <div class={'p-4 flex items-center justify-center'}>
              <Links creator={props.creator} onJJStreamsClick={props.onJJStreamsClick}/>
            </div>
          </Show>
          <Show when={!props.creator.links}>
            <div class={'p-4 flex items-center justify-center'}>
              <p>No Links found</p>
            </div>
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

interface LinksProps {
  creator: YogsCreator,
  onJJStreamsClick?: () => void
}

export const Links: Component<LinksProps> = (props) => {
  const links = props.creator.links!


  const linkOrder = [
    'twitch',
    'youtube',
    'bsky',
    'twitter',
    'tiktok',
    'instagram',
  ]

  const filteredLinks = links
    .filter(link => link.type)
    .filter(link => linkOrder.includes(link.type!))

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
      default:
        return 'hover:text-[#000000]'
    }
  }
  const linkBGHoverColor = (type: string) => {
    switch (type) {
      case 'twitch':
        return 'hover:bg-[#6441A4]'
      case 'youtube':
        return 'hover:bg-[#FF0000]'
      case 'bsky':
        return 'hover:bg-[#1E95EF]'
      case 'twitter':
        return 'hover:bg-[#1DA1F2]'
      case 'tiktok':
        return 'hover:bg-[#69C9D0]'
      case 'instagram':
        return 'hover:bg-[#E4405F]'
      default:
        return 'hover:bg-[#000000]'
    }
  }

  const linkIcon = (type: string) => {
    switch (type) {
      case 'twitch':
        return <FaBrandsTwitch size={24}/>
      case 'youtube':
        return <FaBrandsYoutube size={24}/>
      case 'bsky':
        return <BskyIcon class={'size-6'}/>
      case 'twitter':
        return <FaBrandsTwitter size={24}/>
      case 'tiktok':
        return <FaBrandsTiktok size={24}/>
      case 'instagram':
        return <FaBrandsInstagram size={24}/>
      case 'discord':
        return <FaBrandsDiscord size={24}/>
      case 'reddit':
        return <FaBrandsReddit size={24}/>
      case 'patreon':
        return <FaBrandsPatreon size={24}/>
      case 'website':
        return <FaSolidLink size={24}/>
      default:
        return <FaSolidLink size={24}/>
    }
  }

  return (
    <div class={'flex flex-col gap-4 w-full'}>
      <div class={'flex flex-row flex-wrap gap-2 justify-center'}>
        <For each={filteredLinks}>
          {(link) => (
            <a
              href={link.url}
              target={'_blank'}
              class={twMerge('p-2 rounded-full transition-all', linkHoverColor(link.type!))}
              aria-label={`${props.creator.name} ${link.type}`}
            >
              {linkIcon(link.type!)}
            </a>
          )}
        </For>
      </div>
      <Show when={props.onJJStreamsClick}>
        <button
          class={'flex flex-row gap-2 items-center justify-center p-2 rounded-full bg-primary text-white hover:bg-primary-400 transition-all'}
          onClick={() => props.onJJStreamsClick?.()}
        >
          <JJIcon class={'size-6'}/>
          <span>Show Jingle Jam Streams</span>
        </button>
      </Show>
      <Switch>
        <Match when={props.creator.links?.find(link => link.type === 'discord')}>
          <a
            href={props.creator.links?.find(link => link.type === 'discord')?.url}
            target={'_blank'}
            class={twMerge('flex flex-row gap-2 items-center justify-center p-2 rounded-full bg-[#5865F2] text-white hover:bg-[#4752C4] transition-all')}
            aria-label={`${props.creator.name} discord`}
          >
            <FaBrandsDiscord size={24}/>
            <span>Join Discord</span>
          </a>
        </Match>
        <Match when={props.creator.links?.find(link => link.type === 'patreon')}>
          <a
            href={props.creator.links?.find(link => link.type === 'patreon')?.url}
            target={'_blank'}
            class={twMerge('flex flex-row gap-2 items-center justify-center p-2 rounded-full bg-[#F96854] text-white hover:bg-[#E75A46] transition-all')}
            aria-label={`${props.creator.name} patreon`}
          >
            <FaBrandsPatreon size={24}/>
            <span>Support on Patreon</span>
          </a>
        </Match>
      </Switch>
    </div>
  )
}

import { type Component, createSignal } from 'solid-js'
import { Accordion } from '@kobalte/core'
import {
  FaSolidChevronDown,
  FaSolidChevronLeft,
  FaSolidChevronRight,
  FaSolidEnvelope,
  FaSolidXmark,
} from 'solid-icons/fa'
import { twMerge } from 'tailwind-merge'
import { OverlayConfiguration } from '../features/overlay/overview/OverlayConfiguration'
import { PublicOverlayConfiguration } from '../features/overlay/overview/PublicOverlayConfiguration'
import type { User } from '../../lib/auth/User'

import panel1 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_1.png'
import panel2 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_2.png'
import panel3 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_3.png'
import overlay1 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_1.png'
import overlay2 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_2.png'
import overlay3 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_3.png'
import overlay4 from '../../images/extension2025/JJ_Twitch_Overlay_Screenshots_4.png'
import { BskyIcon, DiscordIcon, RedditIcon } from '../common/icons/JJIcons.tsx'

const Carousel: Component<{ images: ImageMetadata[]; alt: string }> = (
  props,
) => {
  const alt = props.alt
  const images = props.images
  const [idx, setIdx] = createSignal(0)
  const [lightbox, setLightbox] = createSignal<null | number>(null)

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length)
  const next = () => setIdx((i) => (i + 1) % images.length)
  const img = () => images[idx()]
  return (
    <div class="relative w-full max-w-3xl select-none">
      <div class="relative aspect-video w-full overflow-hidden rounded-sm border border-accent-500/60 bg-black/40">
        <img
          src={img().src}
          alt={alt}
          class="h-full w-full cursor-zoom-in object-contain"
          loading="lazy"
          onClick={() => setLightbox(idx())}
        />
        <button
          class="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm bg-black/60 p-2 text-white hover:bg-black/80"
          onClick={prev}
          aria-label="Previous"
        >
          <FaSolidChevronLeft />
        </button>
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-black/60 p-2 text-white hover:bg-black/80"
          onClick={next}
          aria-label="Next"
        >
          <FaSolidChevronRight />
        </button>
      </div>
      <div class="mt-3 flex justify-center gap-2">
        {images.map((src, i) => (
          <button
            class={twMerge(
              'h-14 w-20 overflow-hidden rounded-sm border border-transparent bg-black/40 opacity-70 hover:opacity-100',
              i === idx() && 'border-accent-500 opacity-100',
            )}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
          >
            <img
              src={src.src}
              alt={`${alt} ${i + 1}`}
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightbox() !== null && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            class="absolute right-4 top-4 rounded-sm bg-black/60 p-2 text-white hover:bg-black/80"
            onClick={(e) => {
              e.stopPropagation()
              setLightbox(null)
            }}
            aria-label="Close"
          >
            <FaSolidXmark />
          </button>
          <img
            src={images[lightbox() ?? 0].src}
            alt={`${alt} enlarged`}
            class="max-h-[90vh] max-w-[90vw] rounded-sm shadow-lg"
          />
        </div>
      )}
    </div>
  )
}

export const StreamResources: Component<{ user: User | null }> = (props) => {
  const isLoggedIn = () => props.user !== null

  return (
    <div class="w-full">
      {/* The h1 and intro text above are rendered by the page */}
      <div class="mx-auto flex w-fit flex-col items-center p-1 text-center text-base text-white md:w-[70%] md:text-2xl">
        <Feedback />
      </div>

      <Accordion.Root class="flex w-full flex-col text-white" collapsible>
        {/* Twitch Extension */}
        <Accordion.Item value="twitch" class="w-full">
          <Accordion.Header class="w-full">
            <Accordion.Trigger class="border group m-2 flex w-full flex-row items-center rounded-sm border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow-sm hover:scale-102 hover:brightness-102">
              <p class="flex-1 text-left">Twitch Extension</p>
              <FaSolidChevronDown class="transition-all group-data-expanded:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="w-full p-2">
            <div class="flex flex-col items-center gap-4 text-white">
              <p class="text-center font-semibold fl-text-2xl/3xl">
                Jingle Jam Community Twitch Extension
              </p>
              <p class="text-center">
                The Extension is for everyone who participates in the Jingle Jam
                and streams on Twitch.
              </p>
              <p class="text-center">
                They allow your viewers to see the charities and other community
                fundraisers.
              </p>
              <p class="text-center">
                Feedback regarding the extension is always welcome.
              </p>

              <div class="mt-2 flex flex-col items-center gap-1">
                <p class="fl-text-lg/xl">Twitch Panel Extension</p>
                <a
                  class="p-1 text-lg underline hover:text-twitch-100"
                  href="https://dashboard.twitch.tv/extensions/7m5fitr4o8raxn6fv59lndv2iy0uuz"
                  target="_blank"
                >
                  Get the Panel Extension on Twitch
                </a>
              </div>

              <Carousel
                images={[panel1, panel2, panel3]}
                alt="JJ Twitch Panel Extension Screenshots"
              />

              <div class="mt-6 flex flex-col items-center gap-1">
                <p class="fl-text-lg/xl">Twitch Overlay Extension</p>
                <a
                  class="p-1 text-lg underline hover:text-twitch-100"
                  href="https://dashboard.twitch.tv/extensions/9urrg74yzq8di9hqr5prsto5lbmq3x"
                  target="_blank"
                >
                  Get the Overlay Extension on Twitch
                </a>
              </div>
              <p class="text-center">
                The Overlay sits on top of the Twitch video player and only
                shows up while viewers hover over the stream.
              </p>
              <p class="text-center">
                It has the same charities, fundraisers and schedules as the
                Panel.
              </p>

              <Carousel
                images={[overlay1, overlay2, overlay3, overlay4]}
                alt="JJ Twitch Overlay Extension Screenshots"
              />

              <a class="text-white underline" href="/twitch-extension/privacy">
                Privacy Policy
              </a>

              <div class="mt-4 text-center text-sm text-white/80">
                <p>
                  Thanks to Nairdwood for making some of the Extension assets.
                  And thanks to No1mann for the access to the Jingle Jam
                  Donation Tracker.
                </p>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {/* OBS Overlays */}
        <Accordion.Item value="overlays" class="w-full">
          <Accordion.Header class="w-full">
            <Accordion.Trigger class="border group m-2 flex w-full flex-row items-center rounded-sm border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow-sm hover:scale-102 hover:brightness-102">
              <p class="flex-1 text-left">OBS Overlays</p>
              <FaSolidChevronDown class="transition-all group-data-expanded:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="w-full p-2">
            <div class="mx-auto flex w-fit flex-col items-center p-1 text-center text-base text-white md:w-[50%] md:text-2xl">
              <p class="p-1 text-2xl font-bold md:p-2 md:text-4xl">
                JJ Community OBS Overlays
              </p>
              <p>
                These overlays are designed for OBS browser sources. Configure
                your overlay below and copy the generated link.
              </p>
              <p class="text-xl font-semibold">Feedback is appreciated!</p>
              <p class="font-bold">
                Up to date Charities and Fundraisers are available only after
                the Jingle Jam has started.
              </p>
              <Feedback />
            </div>
            {isLoggedIn() && <OverlayConfiguration user={props.user as User} />}
            {!isLoggedIn() && (
              <PublicOverlayConfiguration user={props.user as User} />
            )}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}

const Feedback: Component = () => {
  return (
    <div class={'flex flex-col items-center justify-start text-white p-2 gap-1'}>
      <p class={'text-base font-bold'}>Send Feedback</p>
      <div class={'flex flex-row gap-4'}>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-white/10'
          }
          href={'https://discord.gg/hBdKXkB'}
        >
          <DiscordIcon class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-white/10'
          }
          href={'https://bsky.app/profile/ostof.bsky.social'}
        >
          <BskyIcon class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-white/10'
          }
          href={'mailto:ostof13@gmail.com'}
        >
          <FaSolidEnvelope class={'size-5'} />
        </a>
        <a
          class={
            'rounded-full transition-all hover:scale-110 hover:bg-white/10'
          }
          href={'https://old.reddit.com/message/compose/?to=Ostof'}
        >
          <RedditIcon class={'size-5'} />
        </a>
      </div>
    </div>
  )
}

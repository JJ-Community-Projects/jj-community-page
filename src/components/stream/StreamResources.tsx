import { type Component, createSignal } from 'solid-js'
import { Accordion } from '@kobalte/core'
import { FaSolidChevronDown, FaSolidChevronLeft, FaSolidChevronRight, FaSolidXmark } from 'solid-icons/fa'
import { twMerge } from 'tailwind-merge'
import { OverlayConfiguration } from '../features/overlay/overview/OverlayConfiguration'
import { PublicOverlayConfiguration } from '../features/overlay/overview/PublicOverlayConfiguration'
import type { User } from '../../lib/auth/User'

import img1 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_1.png'
import img2 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_2.png'
import img3 from '../../images/extension2025/JJ_Twitch_Extension_Screenshots_3.png'

const Carousel: Component = () => {
  const alt = 'JJ Twitch Extension Screenshots'
  const images = [img1, img2, img3]
  const [idx, setIdx] = createSignal(0)
  const [lightbox, setLightbox] = createSignal<null | number>(null)

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length)
  const next = () => setIdx((i) => (i + 1) % images.length)
  const img = () => images[idx()]
  return (
    <div class="relative w-full max-w-3xl select-none">
      <div class="relative aspect-video w-full overflow-hidden rounded border border-accent-500/60 bg-black/40">
        <img
          src={img().src}
          alt={alt}
          class="h-full w-full cursor-zoom-in object-contain"
          loading="lazy"
          onClick={() => setLightbox(idx())}
        />
        <button
          class="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/60 p-2 text-white hover:bg-black/80"
          onClick={prev}
          aria-label="Previous"
        >
          <FaSolidChevronLeft />
        </button>
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/60 p-2 text-white hover:bg-black/80"
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
              'h-14 w-20 overflow-hidden rounded border border-transparent opacity-70 hover:opacity-100',
              i === idx() && 'border-accent-500 opacity-100',
            )}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
          >
            <img src={src.src} alt={`${alt} ${i + 1}`} class="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {lightbox() !== null && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            class="absolute right-4 top-4 rounded bg-black/60 p-2 text-white hover:bg-black/80"
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
            class="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
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
      <div class="mx-auto flex w-fit flex-col items-center p-1 text-center text-base text-white md:w-[70%] md:text-2xl">
        <p class="p-2 text-2xl font-bold md:text-4xl">Stream Resources</p>
        <p class="text-white/90 text-base md:text-xl">
          Everything you need to integrate Jingle Jam into your stream: Twitch Extensions and OBS Overlays.
        </p>
      </div>

      <Accordion.Root class="flex w-full flex-col text-white" collapsible>
        {/* Twitch Extensions */}
        <Accordion.Item value="twitch" class="w-full">
          <Accordion.Header class="w-full">
            <Accordion.Trigger
              class="hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow"
            >
              <p class="flex-1 text-left">Twitch Extensions</p>
              <FaSolidChevronDown class="transition-all group-data-[expanded]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="w-full p-2">
            <div class="flex flex-col items-center gap-4 text-white">
              <p class="~text-2xl/3xl text-center font-semibold">Jingle Jam Community Twitch Extensions</p>
              <p class="text-center">These Extensions are for everyone who participates in the Jingle Jam and streams on Twitch.</p>
              <p class="text-center">They allow your viewers to see the charities and other community fundraisers.</p>
              <p class="text-center">Feedback regarding the extensions is always welcome.</p>

              <div class="mt-2 flex flex-col items-center gap-1">
                <p class="~text-lg/xl">Twitch Panel Extension</p>
                <a
                  class="p-1 text-lg underline hover:text-twitch-100"
                  href="https://dashboard.twitch.tv/extensions/7m5fitr4o8raxn6fv59lndv2iy0uuz"
                  target="_blank"
                >
                  Get the Panel Extension on Twitch
                </a>
              </div>

              <Carousel />

              <a class="underline text-white" href="/twitch-extension/privacy">Privacy Policy</a>

              <div class="mt-4 text-center text-sm text-white/80">
                <p>
                  Thanks to Nairdwood for making some of the Extension assets. And thanks to No1mann for the access to the Jingle Jam Donation Tracker.
                </p>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {/* OBS Overlays */}
        <Accordion.Item value="overlays" class="w-full">
          <Accordion.Header class="w-full">
            <Accordion.Trigger
              class="hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow"
            >
              <p class="flex-1 text-left">OBS Overlays</p>
              <FaSolidChevronDown class="transition-all group-data-[expanded]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="w-full p-2">
            <div class="mx-auto flex w-fit flex-col items-center p-1 text-center text-base text-white md:w-[50%] md:text-2xl">
              <p class="p-1 text-2xl font-bold md:p-2 md:text-4xl">JJ Community OBS Overlays</p>
              <p>These overlays are designed for OBS browser sources. Configure your overlay below and copy the generated link.</p>
              <p class="text-xl font-bold">Feedback is appreciated!</p>
            </div>
            {isLoggedIn() && <OverlayConfiguration user={props.user as User} />}
            {!isLoggedIn() && <PublicOverlayConfiguration user={props.user as User} />}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}

export default StreamResources

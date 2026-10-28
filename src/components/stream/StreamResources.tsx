import { type Component } from 'solid-js'
import { OverlayConfiguration } from '../features/overlay/overview/OverlayConfiguration'
import type { User } from '../../lib/auth/User'
import { Button } from '../ui/Button'
import { Accordion, AccordionItem } from '../ui/Accordion'
import { Tile } from '../ui/Tile'

import {
  Carousel,
  OVERLAY_EXTENSION_URL,
  PANEL_EXTENSION_URL,
  overlayImages,
  panelImages,
} from './ExtensionScreenshots'

export const StreamResources: Component<{ user: User | null }> = (props) => (
  // The page header and feedback links are rendered by the page
  <Accordion class="flex w-full flex-col gap-2" collapsible>
    <AccordionItem value="twitch" title="Twitch Extension">
      <Tile class="flex flex-col items-center gap-4 text-center text-sm sm:text-base">
        <p class="max-w-prose">
          The extension is for everyone who participates in the Jingle Jam and
          streams on Twitch. It lets your viewers see the charities and other
          community fundraisers. Feedback is always welcome.
        </p>

        <h3 class="text-lg font-semibold">Twitch Panel Extension</h3>
        <Button
          href={PANEL_EXTENSION_URL}
          brand="twitch"
          target="_blank"
          size="sm"
        >
          Get the Panel Extension on Twitch
        </Button>
        <Carousel
          images={panelImages}
          alt="JJ Twitch Panel Extension screenshot"
        />

        <h3 class="mt-4 text-lg font-semibold">Twitch Overlay Extension</h3>
        <Button
          href={OVERLAY_EXTENSION_URL}
          brand="twitch"
          target="_blank"
          size="sm"
        >
          Get the Overlay Extension on Twitch
        </Button>
        <p class="text-fg-muted max-w-prose">
          The overlay sits on top of the Twitch video player and only shows up
          while viewers hover over the stream. It has the same charities,
          fundraisers and schedules as the panel.
        </p>
        <Carousel
          images={overlayImages}
          alt="JJ Twitch Overlay Extension screenshot"
        />

        <a class="font-medium underline" href="/twitch-extension/privacy">
          Privacy Policy
        </a>
        <p class="text-fg-muted text-xs">
          Thanks to Nairdwood for making some of the extension assets, and to
          No1mann for the access to the Jingle Jam Donation Tracker.
        </p>
      </Tile>
    </AccordionItem>

    <AccordionItem value="overlays" title="OBS Overlays">
      <div class="text-on-canvas flex flex-col items-center gap-1 px-2 text-center">
        <p class="max-w-prose">
          These overlays are designed for OBS browser sources. Configure your
          overlay below and copy the generated link.
        </p>
        <p class="text-on-canvas-muted max-w-prose text-sm">
          Up to date charities and fundraisers are available only after the
          Jingle Jam has started. Feedback is appreciated!
        </p>
      </div>
      <OverlayConfiguration user={props.user} />
    </AccordionItem>
  </Accordion>
)

export type OverlaySize = { width: number; height: number }

export type OverlayFormat = {
  /** Browser source size shown next to the overlay's name; none when there is no recommendation. */
  obs?: string
  /** The preview iframe's own size; it is scaled down to fit the page. */
  preview: OverlaySize
}

const panel: OverlayFormat = { obs: '300×450', preview: { width: 300, height: 450 } }
const ticker: OverlayFormat = { obs: '1920×80', preview: { width: 1920, height: 80 } }

// The campaign goal previews are taller than the overlay: they show the debug controls
const formats = {
  charities2: panel,
  'donation-matches': { obs: '480×320', preview: { width: 480, height: 320 } },
  schedule: panel,
  'team-schedule': panel,
  charities: ticker,
  fundraisers: ticker,
  'team-fundraiser': ticker,
  'cause-fundraiser': ticker,
  'campaign-goal': { obs: '≈300×100', preview: { width: 320, height: 320 } },
  'big-campaign-goal': { obs: '1920×100', preview: { width: 1280, height: 320 } },
  'basic-ribbon-label': { obs: 'any × 100', preview: { width: 400, height: 100 } },
} satisfies Record<string, OverlayFormat>

export type OverlayId = keyof typeof formats
export const OVERLAY_FORMATS: Record<OverlayId, OverlayFormat> = formats

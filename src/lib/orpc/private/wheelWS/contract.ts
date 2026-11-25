import { z } from 'zod/v4'
import { oc, type } from '@orpc/contract'
import type { ClientDurableIterator } from '@orpc/experimental-durable-iterator/client'
import type { DurableIteratorObject } from '@orpc/experimental-durable-iterator'

// Wheel overlay WS (DEI-backed): the dashboard's Spin button reaches every overlay on the user's link.

/** One spin. `r` in [0, 1) picks the winner (`items[floor(r * n)]`), so every overlay lands on the same item. */
export type WheelSpinEvent = { event: 'spin'; id: string; r: number }

export interface IWheelObject extends DurableIteratorObject<WheelSpinEvent> {}

export const WheelOverlayLinkSchema = z.object({
  userId: z.number().int().positive(),
  key: z.string().min(1).max(64),
})

// Overlay (no login, OBS): the link's user id + key open the user's wheel channel
const subscribe = oc
  .input(WheelOverlayLinkSchema)
  .output(type<ClientDurableIterator<IWheelObject, never>>())

// Configurator: the logged-in user's id + key for the overlay link
const overlayKey = oc.output(WheelOverlayLinkSchema)

// Dashboard: spin every overlay on the user's channel. `spun` is false while the last spin still runs.
const spin = oc.output(
  z.object({
    spun: z.boolean(),
    /** Overlays connected right now. */
    listeners: z.number().int().nonnegative(),
  }),
)

export const privateWheelWSContract = {
  subscribe,
  overlayKey,
  spin,
}

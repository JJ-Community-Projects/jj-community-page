import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import { onError } from '@orpc/client'
import { loggableError } from '../../../../db/loggableError.ts'
import type { WheelSpinEvent } from '../contract.ts'

/** A spin takes about 7 s on the overlay; a press during it is ignored. */
export const SPIN_COOLDOWN_MS = 8_000

/**
 * One user's wheel channel. Sends nothing on subscribe; `spin()` broadcasts one event to every open
 * socket. No resume retention (DEI default), so a reconnect never replays an old spin.
 */
export class WheelObject extends DurableIteratorObject<WheelSpinEvent> {
  // In memory only: an evicted object forgets it, which at worst allows one early spin
  private lastSpinAt = 0

  constructor(state: DurableObjectState<{}>, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(loggableError(e)))],
    })
  }

  async spin(): Promise<{ spun: boolean; listeners: number }> {
    const listeners = this.ctx.getWebSockets().length
    const now = Date.now()
    if (now - this.lastSpinAt < SPIN_COOLDOWN_MS) return { spun: false, listeners }
    this.lastSpinAt = now
    if (listeners > 0) {
      const r = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
      this.publishEvent({ event: 'spin', id: crypto.randomUUID(), r })
    }
    return { spun: true, listeners }
  }
}

import { env } from 'cloudflare:workers'
import { implement, ORPCError } from '@orpc/server'
import { DurableIterator } from '@orpc/experimental-durable-iterator'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { privateWheelWSContract } from './contract.ts'
import { wheelChannel } from './channels.ts'
import { isWheelOverlayKey, wheelOverlayKey } from './overlayKey.ts'
import type { WheelObject } from './do/WheelObject.ts'

const os = implement(privateWheelWSContract)

const subscribe = os.subscribe.handler(async ({ input }) => {
  const signingKey = env.ORPC_DEI_SIGNING_KEY
  if (!(await isWheelOverlayKey(signingKey, input.userId, input.key))) {
    throw new ORPCError('UNAUTHORIZED')
  }
  return new DurableIterator<WheelObject>(wheelChannel(input.userId), {
    signingKey,
    tokenTTLSeconds: 300,
  })
})

const overlayKey = os.overlayKey.use(authMiddleware).handler(async ({ context }) => ({
  userId: context.userId,
  key: await wheelOverlayKey(env.ORPC_DEI_SIGNING_KEY, context.userId),
}))

const spin = os.spin.use(authMiddleware).handler(async ({ context }) => {
  const DO = env.WheelObject
  return DO.get(DO.idFromName(wheelChannel(context.userId))).spin()
})

export const privateWheelWSRouter = {
  subscribe,
  overlayKey,
  spin,
}

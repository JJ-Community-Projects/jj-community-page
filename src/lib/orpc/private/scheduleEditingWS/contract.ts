import { z } from 'zod/v4'
import { oc, type } from '@orpc/contract'
import type { ClientDurableIterator } from '@orpc/experimental-durable-iterator/client'
import type { DurableIteratorObject } from '@orpc/experimental-durable-iterator'
import { EditChannelMessageSchema } from './scheduleEditingTypes.ts'

// Types inferred from schemas
type EditChannelMessage = z.infer<typeof EditChannelMessageSchema>

// Durable Iterator object interface (payloads must match DO publishEvent payloads)
interface IScheduleEditingObject
  extends DurableIteratorObject<EditChannelMessage> {}

/**
 * Real-time stream for schedule draft editing channel (authenticated + authorized)
 */
const streamDraftWSContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      /**
       * A token renewal of an open editor (sent by the client before the token expires): checks
       * access only and leaves the draft alone. Without it, opening the editor makes sure the
       * draft copy exists.
       */
      renew: z.boolean().optional(),
    }),
  )
  .output(type<ClientDurableIterator<IScheduleEditingObject, never>>())

export const privateScheduleEditingWSContract = {
  streamDraftWS: streamDraftWSContract,
}

import { z } from 'zod/v4'
import { oc, type } from '@orpc/contract'
import type { ClientDurableIterator } from '@orpc/experimental-durable-iterator/client'
import type { DurableIteratorObject } from '@orpc/experimental-durable-iterator'
import { EditChannelMessageSchema } from '../scheduleEditing/scheduleEditingTypes.ts'

// Types inferred from schemas
type EditChannelMessage = z.infer<typeof EditChannelMessageSchema>

// Durable Iterator object interface (payloads must match DO publishEvent payloads)
interface IScheduleEditingObject extends DurableIteratorObject<EditChannelMessage> {}

/**
 * Real-time stream for schedule draft editing channel (authenticated + authorized)
 */
const streamDraftWSContract = oc
  .input(z.object({ scheduleId: z.number().int().positive() }))
  .output(type<ClientDurableIterator<IScheduleEditingObject, never>>())

export const privateScheduleEditingWSContract = { streamDraftWS: streamDraftWSContract }

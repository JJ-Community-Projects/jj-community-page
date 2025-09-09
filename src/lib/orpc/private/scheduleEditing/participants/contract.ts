import {oc} from '@orpc/contract'
import {z} from 'zod/v4'

export const addParticipantContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number(),
    userId: z.number().int().positive(),
  }))
  .output(z.object({ ok: z.literal(true) }))

export const removeParticipantContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number(),
    userId: z.number().int().positive(),
  }))
  .output(z.object({ ok: z.literal(true) }))

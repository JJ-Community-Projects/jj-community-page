import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

const addTagToStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      streamId: z.number(),
      tag: z.string().min(1),
      createIfMissing: z.boolean().optional(),
    }),
  )
  .output(
    z.object({
      id: z.number().int().positive(),
      slug: z.string(),
      name: z.string(),
    }),
  )

const removeTagFromStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      streamId: z.number(),
      id: z.number().int().positive(),
    }),
  )
  .output(z.object({ ok: z.literal(true) }))

// Limit-check: max 5 tags per stream
const canAddTagToStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      streamId: z.number(),
    }),
  )
  .output(z.object({ canAdd: z.boolean(), tags: z.number() }))

export const contracts = {
  addTagToStreamContract,
  removeTagFromStreamContract,
  canAddTagToStreamContract,
}

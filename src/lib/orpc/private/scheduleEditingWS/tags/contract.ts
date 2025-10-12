import {oc} from '@orpc/contract'
import {z} from 'zod/v4'

export const addTagToStreamContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number(),
    tag: z.string().min(1),
  }))
  .output(z.object({id: z.number().int().positive(), slug: z.string(), name: z.string()}))

export const removeTagFromStreamContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number(),
    id: z.number().int().positive(),
  }))
  .output(z.object({ok: z.literal(true)}))

// Limit-check: tags per stream (see util/limits)
export const canAddTagToStreamContract = oc
  .input(z.object({
    scheduleId: z.number().int().positive(),
    streamId: z.number(),
  }))
  .output(z.object({ canAdd: z.boolean(), tags: z.number(), maxTags: z.number() }))

import { oc } from '@orpc/contract'
import { z } from 'zod/v4'
import { EditStreamSchema } from '../scheduleEditingTypes'

const addStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      tempId: z.string().optional(),
      title: z.string(),
      start: z.date(),
      end: z.date(),
      visible: z.boolean().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      youtubeVodUrl: z.string().optional(),
      twitchVodUrl: z.string().optional(),
    }),
  )
  .output(z.object({ id: z.number() }))

const updateStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      id: z.number(),
      patch: EditStreamSchema.partial().extend({
        id: z.never().optional(),
        scheduleId: z.never().optional(),
      }),
    }),
  )
  .output(z.object({ updatedAt: z.date() }))

const updateStreamsContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      updates: z
        .array(
          z.object({
            id: z.number(),
            patch: EditStreamSchema.partial().extend({
              id: z.never().optional(),
              scheduleId: z.never().optional(),
            }),
          }),
        )
        .min(1),
    }),
  )
  .output(
    z.object({
      updated: z.array(z.object({ id: z.number(), updatedAt: z.date() })),
    }),
  )

const deleteStreamContract = oc
  .input(z.object({ scheduleId: z.number().int().positive(), id: z.number() }))
  .output(z.object({ ok: z.literal(true) }))

const deleteStreamsContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      ids: z.array(z.number()).min(1),
    }),
  )
  .output(z.object({ ok: z.literal(true), deletedIds: z.array(z.number()) }))

const lockStreamContract = oc
  .input(
    z.object({ scheduleId: z.number().int().positive(), streamId: z.number() }),
  )
  .output(z.object({ ok: z.literal(true) }))

const unlockStreamContract = oc
  .input(
    z.object({ scheduleId: z.number().int().positive(), streamId: z.number() }),
  )
  .output(z.object({ ok: z.literal(true) }))

const addStreamWithDetailsContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      tempId: z.string().optional(),

      // Base stream fields (same as addStream)
      title: z.string(),
      start: z.date(),
      end: z.date(),
      visible: z.boolean().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      youtubeVodUrl: z.string().optional(),
      twitchVodUrl: z.string().optional(),

      // New details
      participants: z.array(z.number().int().positive()).optional(), // userIds
      tags: z
        .array(
          z.object({
            value: z.string().min(1),
            createIfMissing: z.boolean().optional(),
          }),
        )
        .optional(),
    }),
  )
  .output(
    z.object({
      id: z.number(),
      participantsAdded: z.array(z.number()).default([]),
      tagsAdded: z
        .array(
          z.object({
            id: z.number().int().positive(),
            slug: z.string(),
            name: z.string(),
          }),
        )
        .default([]),
    }),
  )

const updateStreamWithDetailsContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      id: z.number(),
      patch: EditStreamSchema.partial().optional(),
      participants: z.array(z.number().int().positive()).optional(),
      tags: z.array(z.number().int().positive()).optional(),
    }),
  )
  .output(z.void())

// Limit-check: per-date streams cap (8 per date)
const canAddStreamContract = oc
  .input(
    z.object({
      scheduleId: z.number().int().positive(),
      date: z.date(),
    }),
  )
  .output(
    z.object({ canAdd: z.boolean(), streams: z.number(), date: z.date() }),
  )

export const contracts = {
  addStreamContract,
  updateStreamContract,
  updateStreamsContract,
  deleteStreamContract,
  deleteStreamsContract,
  lockStreamContract,
  unlockStreamContract,
  addStreamWithDetailsContract,
  updateStreamWithDetailsContract,
  canAddStreamContract,
}

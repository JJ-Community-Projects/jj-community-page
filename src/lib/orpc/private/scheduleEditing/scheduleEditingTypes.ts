import { z } from 'zod/v4'
import { UserDisplaySchema } from '../schemas/users.ts'
import { ScheduleSchema } from '../schemas/schedules.ts'

/**
 * 1) Core stream schemas
 */
export const EditStreamSchema = z.object({
  id: z.number(),
  scheduleId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  title: z.string(),
  visible: z.boolean(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  youtubeVodUrl: z.string().nullable().optional(),
  twitchVodUrl: z.string().nullable().optional(),
  start: z.date(),
  end: z.date(),
  updatedAt: z.date().optional(),
})

// Draft stream is EditStream + lock metadata
export const DraftStreamSchema = EditStreamSchema.extend({
  lockedBy: z.number().nullable(),
})

export type StreamEditableFields = z.infer<typeof EditStreamSchema>

/**
 * 2) Schedule meta (Init)
 */
export const InitScheduleMetaSchema = ScheduleSchema.pick({
  id: true,
  title: true,
  slug: true,
  year: true,
  visible: true,
  updatedAt: true,
})

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
})

/**
 * 4) SSE Init payload (Snapshot shape)
 */
export const InitPayloadSchema = z.object({
  schedule: InitScheduleMetaSchema,
  streams: z.array(DraftStreamSchema),
  tagsByStream: z.record(z.string(), z.array(TagSchema)),
  participantsByStream: z.record(z.string(), z.array(UserDisplaySchema)),
})

/**
 * 5) SSE event payloads
 */
export const ScheduleUpdatedPayloadSchema = z.object({
  patch: EditStreamSchema.partial(),
  draftCreated: z.boolean().optional(),
})

export const StreamAddedPayloadSchema = DraftStreamSchema
export const StreamUpdatedPayloadSchema = z.object({
  id: z.number(),
  patch: EditStreamSchema.partial(),
})

// New: stream updated with details (single consolidated payload)
export const StreamUpdatedWithDetailPayloadSchema = z.object({
  id: z.number(),
  patch: EditStreamSchema.partial().optional(),
  participants: z.array(UserDisplaySchema).optional(),
  tags: z.array(TagSchema).optional(),
})

export const StreamDeletedPayloadSchema = z.object({ id: z.number() })

export const TagAddedPayloadSchema = z.object({
  streamId: z.number(),
  id: z.number(),
  slug: z.string(),
  name: z.string(),
})
export const TagRemovedPayloadSchema = z.object({
  streamId: z.number(),
  id: z.number(),
})

export const ParticipantAddedPayloadSchema = z.object({
  streamId: z.number(),
  user: UserDisplaySchema,
})
export const ParticipantRemovedPayloadSchema = z.object({
  streamId: z.number(),
  userId: z.number(),
})

export const DraftPublishedPayloadSchema = z.object({
  // Over-the-wire JSON keys are strings
  idMap: z.record(z.string(), z.number()).optional(),
})
export const DraftDiscardedPayloadSchema = z.object({})

export const LockPayloadSchema = z.object({
  streamId: z.number(),
  userId: z.number(),
})
export const UnlockPayloadSchema = z.object({
  streamId: z.number(),
  userId: z.number(),
})

/**
 * 6) SSE discriminated union
 */
export const EditChannelMessageSchema = z
  .union([
    z.object({ event: z.literal('init'), payload: InitPayloadSchema }),
    z.object({
      event: z.literal('schedule_updated'),
      payload: ScheduleUpdatedPayloadSchema,
    }),
    z.object({
      event: z.literal('stream_added'),
      payload: StreamAddedPayloadSchema,
    }),
    z.object({
      event: z.literal('stream_updated'),
      payload: StreamUpdatedPayloadSchema,
    }),
    z.object({
      event: z.literal('stream_updated_with_details'),
      payload: StreamUpdatedWithDetailPayloadSchema,
    }),
    z.object({
      event: z.literal('stream_deleted'),
      payload: StreamDeletedPayloadSchema,
    }),
    z.object({ event: z.literal('tag_added'), payload: TagAddedPayloadSchema }),
    z.object({
      event: z.literal('tag_removed'),
      payload: TagRemovedPayloadSchema,
    }),
    z.object({
      event: z.literal('participant_added'),
      payload: ParticipantAddedPayloadSchema,
    }),
    z.object({
      event: z.literal('participant_removed'),
      payload: ParticipantRemovedPayloadSchema,
    }),
    z.object({
      event: z.literal('draft_published'),
      payload: DraftPublishedPayloadSchema,
    }),
    z.object({
      event: z.literal('draft_discarded'),
      payload: DraftDiscardedPayloadSchema,
    }),
    z.object({ event: z.literal('lock'), payload: LockPayloadSchema }),
    z.object({ event: z.literal('unlock'), payload: UnlockPayloadSchema }),
  ])
  .and(
    z.object({
      scheduleId: z.number().int().positive(),
      editorId: z.number().int().positive(),
    }),
  )

/**
 * 7) Type exports
 */
export type InitScheduleMeta = z.infer<typeof InitScheduleMetaSchema>
export type InitDraftStream = z.infer<typeof DraftStreamSchema>
export type InitTag = z.infer<typeof TagSchema>
export type InitPayload = z.infer<typeof InitPayloadSchema>
export type InitParticipant = z.infer<typeof UserDisplaySchema>

export type ScheduleUpdatedPayload = z.infer<
  typeof ScheduleUpdatedPayloadSchema
>
export type StreamAddedPayload = z.infer<typeof StreamAddedPayloadSchema>
export type StreamUpdatedPayload = z.infer<typeof StreamUpdatedPayloadSchema>
export type StreamDeletedPayload = z.infer<typeof StreamDeletedPayloadSchema>
export type TagAddedPayload = z.infer<typeof TagAddedPayloadSchema>
export type TagRemovedPayload = z.infer<typeof TagRemovedPayloadSchema>
export type ParticipantAddedPayload = z.infer<
  typeof ParticipantAddedPayloadSchema
>
export type ParticipantRemovedPayload = z.infer<
  typeof ParticipantRemovedPayloadSchema
>
export type DraftPublishedPayload = z.infer<typeof DraftPublishedPayloadSchema>
export type DraftDiscardedPayload = z.infer<typeof DraftDiscardedPayloadSchema>
export type LockPayload = z.infer<typeof LockPayloadSchema>
export type UnlockPayload = z.infer<typeof UnlockPayloadSchema>
export type StreamUpdatedWithDetailPayload = z.infer<
  typeof StreamUpdatedWithDetailPayloadSchema
>

export type EditChannelMessage = z.infer<typeof EditChannelMessageSchema>

/**
 * 8) Transport boundary helpers (optional)
 */
export function toDate(v: Date | string | undefined | null): Date | undefined {
  if (!v) return undefined
  return v instanceof Date ? v : new Date(v)
}

export function normalizeInitPayloadDates(p: InitPayload): InitPayload {
  return {
    schedule: {
      ...p.schedule,
      updatedAt: toDate(p.schedule.updatedAt)!,
    },
    streams: p.streams.map((s) => ({
      ...s,
      start: toDate(s.start)!,
      end: toDate(s.end)!,
      updatedAt: toDate(s.updatedAt),
    })),
    tagsByStream: p.tagsByStream,
    participantsByStream: Object.fromEntries(
      Object.entries(p.participantsByStream).map(([k, arr]) => [
        k,
        arr.map((u) => ({ ...u, createdAt: toDate(u.createdAt)! })),
      ]),
    ),
  }
}

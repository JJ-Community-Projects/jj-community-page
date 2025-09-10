import {oc} from '@orpc/contract'
import {z} from 'zod/v4'
import {DraftStreamSchema, TagSchema} from '../scheduleEditingTypes.ts'
import {UserDisplaySchema} from "../../schemas/users.ts";

const ScheduleIdSchema = z.object({scheduleId: z.number().int().positive()})

export const EditScheduleMetaPatchSchema = z.object({
  scheduleId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  year: z.number().int().optional(),
  visible: z.boolean().optional(),
})

export const DraftSnapshotSchema = z.object({
  schedule: z.object({
    id: z.number().int().positive(),
    title: z.string(),
    slug: z.string(),
    year: z.number().int(),
    visible: z.boolean(),
    updatedAt: z.date(),
  }),
  streams: z.array(DraftStreamSchema),
  tagsByStream: z.record(z.string(), z.array(TagSchema)),
  participantsByStream: z.record(z.string(), z.array(UserDisplaySchema)),
})

export const startEditingSessionContract = oc
  .input(ScheduleIdSchema)
  .output(z.object({
    scheduleId: z.number().int().positive(),
    editorId: z.number().int().positive(),
    draftCreated: z.boolean(),
  }))

export const getDraftSnapshotContract = oc
  .input(ScheduleIdSchema)
  .output(DraftSnapshotSchema)

export const upsertScheduleMetaContract = oc
  .input(EditScheduleMetaPatchSchema)
  .output(z.object({updatedAt: z.date()}))

export const publishDraftContract = oc
  .input(ScheduleIdSchema)
  .output(z.object({
    publishedAt: z.date(),
    changes: z.object({
      streams: z.object({
        created: z.number().int().nonnegative(),
        updated: z.number().int().nonnegative(),
        deleted: z.number().int().nonnegative()
      }),
      participants: z.object({added: z.number().int().nonnegative(), removed: z.number().int().nonnegative()}),
      tags: z.object({added: z.number().int().nonnegative(), removed: z.number().int().nonnegative()}),
    })
  }))

export const discardDraftContract = oc
  .input(ScheduleIdSchema)
  .output(z.object({ok: z.literal(true)}))


export type EditScheduleMetaPatch = z.infer<typeof EditScheduleMetaPatchSchema>

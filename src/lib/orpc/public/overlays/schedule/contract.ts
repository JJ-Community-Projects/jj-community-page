import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

// Minimal UI-ready types for the overlay schedule view
export const OverlayScheduleSummary = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  slug: z.string().min(1),
})

export const OverlayScheduleBlock = z.object({
  id: z.number().int().nonnegative(),
  start: z.string().min(1), // ISO string
  end: z.string().min(1),   // ISO string
  title: z.string(),
  participants: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
})

export const OverlayScheduleView = z.object({
  schedule: OverlayScheduleSummary,
  blocks: z.array(OverlayScheduleBlock),
})

export const OverlayScheduleInput = z.object({
  scheduleId: z.number().int().nonnegative().optional(),
  scheduleSlug: z.string().min(1).optional(),
}).refine((x) => Boolean(x.scheduleId) !== Boolean(x.scheduleSlug), {
  message: 'Provide exactly one of scheduleId or scheduleSlug',
})

const viewContract = oc
  .input(OverlayScheduleInput)
  .output(OverlayScheduleView)
  .route({
    path: '/overlays/schedule/view',
    method: 'GET',
    summary: 'Overlay schedule view',
    description: 'Returns UI-ready schedule data for overlays',
    tags: ['overlays', 'schedule'],
  })

export const contracts = {
  viewContract,
}

export type OverlayScheduleViewT = z.infer<typeof OverlayScheduleView>

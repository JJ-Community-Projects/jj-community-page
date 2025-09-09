import {eventIterator, oc} from '@orpc/contract'
import {z} from 'zod/v4'
import {EditChannelMessageSchema} from '../scheduleEditingTypes'

const ScheduleIdSchema = z.object({ scheduleId: z.number().int().positive() })

export const streamDraftSSEContract = oc
  .input(ScheduleIdSchema)
  .output(eventIterator(EditChannelMessageSchema))

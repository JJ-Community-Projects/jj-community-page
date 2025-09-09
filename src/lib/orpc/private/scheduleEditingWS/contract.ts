import {oc, eventIterator} from '@orpc/contract'
import {z} from 'zod/v4'
import {EditChannelMessageSchema} from '../scheduleEditing/scheduleEditingTypes.ts'

export const streamDraftWSContract = oc
  .input(z.object({ scheduleId: z.number().int().positive() }))
  .output(eventIterator(EditChannelMessageSchema));

export const privateScheduleEditingWSContract = { streamDraftWS: streamDraftWSContract };

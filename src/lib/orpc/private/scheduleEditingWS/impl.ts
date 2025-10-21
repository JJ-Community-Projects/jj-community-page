import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { scheduleOwnerOrEditorMiddleware } from './middleware.ts'
import { DurableIterator } from '@orpc/experimental-durable-iterator'
import { ensureDraftInitialized } from './utils.ts'
import { scheduleEditingChannels } from './channels.ts'
import type { ScheduleEditingObject } from './do/ScheduleEditingObject.ts'
import { privateScheduleEditingWSContract } from './contract.ts'

const os = implement(privateScheduleEditingWSContract)

export const streamDraftWS = os.streamDraftWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { db, env, userId } = context
    const { scheduleId } = input
    try {
      await ensureDraftInitialized(db, scheduleId, userId)
      const channelId = scheduleEditingChannels.edit(scheduleId)
      return new DurableIterator<ScheduleEditingObject>(channelId, {
        signingKey: env!.ORPC_DEI_SIGNING_KEY,
        att: { scheduleId: scheduleId, userId: userId },
      })
    } catch (err) {
      console.error('streamDraftWS error', err)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream schedule draft (WS)',
      })
    }
  })

export const privateScheduleEditingWSRouter = { streamDraftWS }

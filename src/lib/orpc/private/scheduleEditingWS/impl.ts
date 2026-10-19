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

/**
 * Lifetime of an editor socket token. The client renews it before it expires, through the
 * access check of `scheduleOwnerOrEditorMiddleware`, so a removed editor or a demoted admin loses
 * the live draft feed within this time.
 */
const EDITOR_TOKEN_TTL_SECONDS = 5 * 60

export const streamDraftWS = os.streamDraftWS
  .use(authMiddleware)
  .use(dbMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const { db, env, userId } = context
    const { scheduleId, renew } = input
    try {
      // A renewal must not touch the draft: the seed's repair of emptied drafts would copy the
      // published streams back into a draft whose streams the editors deleted, and the seed
      // moves `editor_id`.
      if (!renew) await ensureDraftInitialized(db, scheduleId, userId)
      const channelId = scheduleEditingChannels.edit(scheduleId)
      return new DurableIterator<ScheduleEditingObject>(channelId, {
        signingKey: env!.ORPC_DEI_SIGNING_KEY,
        att: { scheduleId: scheduleId, userId: userId },
        tokenTTLSeconds: EDITOR_TOKEN_TTL_SECONDS,
      })
    } catch (err) {
      console.error('streamDraftWS error', err)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to stream schedule draft (WS)',
      })
    }
  })

export const privateScheduleEditingWSRouter = { streamDraftWS }

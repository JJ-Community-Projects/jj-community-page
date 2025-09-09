import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from '../../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {addParticipantContract, removeParticipantContract} from './contract.ts'
import {scheduleOwnerOrEditorMiddleware} from '../middleware.ts'
import {scheduleEditingEventPublisher} from '../eventPublisher.ts'
import {reexports} from '../utils.ts'
import {assertStreamLockAvailableOrOwned} from "../streamEditingLock.ts";
import {userDisplayView} from "../../../../db/schema/views-schema.ts";

const {eq, and, editStreamParticipantsTable} = reexports as any

const os = implement({
  addParticipantContract,
  removeParticipantContract,
}).use(dbMiddleware)

export const addParticipant = os.addParticipantContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, streamId, userId } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(context.env as any, scheduleId, streamId, editorId)


    const user = await db.select()
      .from(userDisplayView)
      .where(eq(userDisplayView.userId, userId))
      .get()

    if (!user) {
      throw new ORPCError('NOT_FOUND', {message:'User not found'})
    }

    await db.insert(editStreamParticipantsTable)
      .values({ scheduleId, streamId, userId })
      .onConflictDoNothing()
      .run()

    scheduleEditingEventPublisher.participantAdded(scheduleId, editorId, streamId, userId, {
      streamId: streamId,
      user: user,
    })

    return { ok: true as const }
  })

export const removeParticipant = os.removeParticipantContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, streamId, userId } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(context.env as any, scheduleId, streamId, editorId)

    const res = await db.delete(editStreamParticipantsTable)
      .where(and(
        eq(editStreamParticipantsTable.scheduleId, scheduleId),
        eq(editStreamParticipantsTable.streamId, streamId),
        eq(editStreamParticipantsTable.userId, userId)
      ))
      .run()

    if ((res as any).rowsAffected === 0) {
      throw new Error('Draft stream participant not found')
    }

    scheduleEditingEventPublisher.participantRemoved(scheduleId, editorId, streamId, userId)
    return { ok: true as const }
  })

export const participantsRouter = {
  addParticipant,
  removeParticipant,
}

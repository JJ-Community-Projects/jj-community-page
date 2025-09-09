import {implement, ORPCError} from '@orpc/server'
import {dbMiddleware} from '../../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {scheduleOwnerOrEditorMiddleware} from '../../scheduleEditing/middleware.ts'
import {addParticipantContract, removeParticipantContract} from '../../scheduleEditing/participants/contract.ts'
import {assertStreamLockAvailableOrOwned} from '../../scheduleEditing/streamEditingLock.ts'
import {userDisplayView} from '../../../../db/schema/views-schema.ts'
import {and, eq} from 'drizzle-orm'
import {editStreamParticipantsTable} from '../../../../db/schema/edit-stream-participants-schema.ts'
import {scheduleEditingChannels} from '../channels.ts'

const os = implement({
  addParticipantContract,
  removeParticipantContract,
}).use(dbMiddleware)

function getScheduleEditingStub(env: Env, scheduleId: number) {
  const channelId = scheduleEditingChannels.edit(scheduleId)
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(channelId))
}

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

    // WS publish via DO
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishParticipantAdded(scheduleId, editorId, { streamId, user })

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

    // WS publish via DO
    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishParticipantRemoved(scheduleId, editorId, { streamId, userId })

    return { ok: true as const }
  })

export const participantsRouter = {
  addParticipant,
  removeParticipant,
}

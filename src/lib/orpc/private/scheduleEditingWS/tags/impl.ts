import {implement} from '@orpc/server'
import {dbMiddleware} from '../../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {addTagToStreamContract, removeTagFromStreamContract} from './contract.ts'
import {scheduleOwnerOrEditorMiddleware} from '../middleware.ts'
import {ensureDraftInitialized, resolveTag} from '../utils.ts'
import {assertStreamLockAvailableOrOwned} from '../streamEditingLock.ts'
import {and, eq} from 'drizzle-orm'
import {editStreamTagsTable} from '../../../../db/schema/edit-stream-tags-schema.ts'
import {scheduleEditingChannels} from '../channels.ts'

const os = implement({
  addTagToStreamContract,
  removeTagFromStreamContract,
}).use(dbMiddleware)

function getScheduleEditingStub(env: Env, scheduleId: number) {
  const channelId = scheduleEditingChannels.edit(scheduleId)
  const DO = env.ScheduleEditingObject
  return DO.get(DO.idFromName(channelId))
}

export const addTagToStream = os.addTagToStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const {scheduleId, streamId, tag} = input

    await assertStreamLockAvailableOrOwned(context.env as any, scheduleId, streamId, editorId)
    await ensureDraftInitialized(db, scheduleId, editorId)

    const t = await resolveTag(db, tag)

    await db.insert(editStreamTagsTable)
      .values({scheduleId, streamId, tagId: t.id})
      .onConflictDoNothing()
      .run()

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishTagAdded(scheduleId, editorId, {
      streamId,
      id: t.id,
      slug: t.slug,
      name: t.name,
    })
    return {id: t.id, slug: t.slug, name: t.name}
  })

export const removeTagFromStream = os.removeTagFromStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const editorId = context.userId
    const {scheduleId, streamId, id} = input

    await assertStreamLockAvailableOrOwned(context.env as any, scheduleId, streamId, editorId)

    const res = await db.delete(editStreamTagsTable)
      .where(and(
        eq(editStreamTagsTable.scheduleId, scheduleId),
        eq(editStreamTagsTable.streamId, streamId),
        eq(editStreamTagsTable.tagId, id)
      ))
      .run()

    if ((res as any).rowsAffected === 0) {
      throw new Error('Draft stream tag not found')
    }

    const stub = getScheduleEditingStub(context.env as any, scheduleId)
    await stub.publishTagRemoved(scheduleId, editorId, { streamId, id })
    return {ok: true as const}
  })

export const tagsRouter = {
  addTagToStream,
  removeTagFromStream,
}

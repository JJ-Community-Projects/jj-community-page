import { implement } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../../middleware/authMiddleware.ts'
import { contracts } from './contract.ts'
import { scheduleOwnerOrEditorMiddleware } from '../middleware.ts'
import { scheduleEditingEventPublisher } from '../eventPublisher.ts'
import { ensureDraftInitialized, resolveTag } from '../utils.ts'
import { editStreamTagsTable } from '../../../../db/schema/schema.ts'
import { and, count, eq } from 'drizzle-orm'
import { assertStreamLockAvailableOrOwned } from '../streamEditingLock.ts'

const os = implement(contracts).use(dbMiddleware)

export const addTagToStream = os.addTagToStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, streamId, tag, createIfMissing } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(
      context.env as any,
      scheduleId,
      streamId,
      editorId,
    )

    await ensureDraftInitialized(db, scheduleId, editorId)

    const t = await resolveTag(db, tag, editorId, !!createIfMissing)

    await db
      .insert(editStreamTagsTable)
      .values({ scheduleId, streamId, tagId: t.id })
      .onConflictDoNothing()
      .run()

    scheduleEditingEventPublisher.tagAdded(
      scheduleId,
      editorId,
      streamId,
      t.id,
      {
        streamId: streamId,
        id: t.id,
        slug: t.slug,
        name: t.name,
      },
    )
    return { id: t.id, slug: t.slug, name: t.name }
  })

export const removeTagFromStream = os.removeTagFromStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const editorId = context.userId
    const { scheduleId, streamId, id } = input

    // Lock check: stream must be unlocked or locked by current user
    await assertStreamLockAvailableOrOwned(
      context.env,
      scheduleId,
      streamId,
      editorId,
    )

    const res = await db
      .delete(editStreamTagsTable)
      .where(
        and(
          eq(editStreamTagsTable.scheduleId, scheduleId),
          eq(editStreamTagsTable.streamId, streamId),
          eq(editStreamTagsTable.tagId, id),
        ),
      )
      .run()

    if ((res as any).rowsAffected === 0) {
      throw new Error('Draft stream tag not found')
    }

    scheduleEditingEventPublisher.tagRemoved(scheduleId, editorId, streamId, id)
    return { ok: true as const }
  })

export const canAddTagToStream = os.canAddTagToStreamContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const { scheduleId, streamId } = input
    const res = await db
      .select({ c: count() })
      .from(editStreamTagsTable)
      .where(
        and(
          eq(editStreamTagsTable.scheduleId, scheduleId),
          eq(editStreamTagsTable.streamId, streamId),
        ),
      )
      .get()
    const tags = (res?.c as number) ?? 0
    return { canAdd: tags < 5, tags }
  })

export const tagsRouter = {
  addTagToStream,
  removeTagFromStream,
  // Limit-checks
  canAddTagToStream,
}

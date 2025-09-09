import {implement} from '@orpc/server'
import {dbMiddleware} from '../../../middleware/dbMiddleware.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {streamDraftSSEContract} from './contract.ts'
import {scheduleOwnerOrEditorMiddleware} from '../middleware.ts'
import {scheduleEditingEventPublisher} from '../eventPublisher.ts'
import {ensureDraftInitialized, loadDraftSnapshot} from '../utils.ts'
import type {EditChannelMessage} from '../scheduleEditingTypes'

const os = implement({streamDraftSSEContract}).use(dbMiddleware)

export const streamDraft = os.streamDraftSSEContract
  .use(authMiddleware)
  .use(scheduleOwnerOrEditorMiddleware)
  .handler(async function* ({context, input, signal}) {
    const db = context.db
    const editorId = context.userId
    const {scheduleId} = input

    await ensureDraftInitialized(db, scheduleId, editorId)
    const snapshot = await loadDraftSnapshot(db, scheduleId)
    // Ensure streams include lock metadata required by DraftStreamSchema
    const initPayload = {...snapshot, streams: snapshot.streams.map((s: any) => ({...s, lockedBy: s.lockedBy ?? null}))}
    const initEvent = {scheduleId, editorId, event: 'init' as const, payload: initPayload}
    console.log('streamDraft', 'init', initEvent)
    yield initEvent

    for await (const payload of scheduleEditingEventPublisher.subscribe('edit', {signal}) as AsyncIterable<EditChannelMessage>) {
      if (payload.scheduleId !== scheduleId) continue
      console.log('streamDraft', payload.event, payload.payload)
      yield payload as EditChannelMessage
    }
  })

export const sseRouter = {
  streamDraft,
}

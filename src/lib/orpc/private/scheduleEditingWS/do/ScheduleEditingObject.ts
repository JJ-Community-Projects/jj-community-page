import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object'
import type {
  DraftDiscardedPayload,
  DraftPublishedPayload,
  EditChannelMessage,
  InitPayload,
  LockPayload,
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
  ScheduleUpdatedPayload,
  StreamAddedPayload,
  StreamDeletedPayload,
  StreamUpdatedPayload,
  StreamUpdatedWithDetailPayload,
  TagAddedPayload,
  TagRemovedPayload,
  UnlockPayload,
} from '../../scheduleEditing/scheduleEditingTypes.ts'

/**
 * Durable Object for Schedule Editing WebSocket stream.
 * Stores latest init snapshot and publishes events to connected clients via DEI.
 */
export class ScheduleEditingObject extends DurableEventIteratorObject<EditChannelMessage> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  async publishInit(scheduleId: number, editorId: number, payload: InitPayload): Promise<Response> {
    await this.writeSnapshot(payload);
    return this.publish({ scheduleId, editorId, event: 'init', payload });
  }

  async publishScheduleUpdated(scheduleId: number, editorId: number, payload: ScheduleUpdatedPayload) {
    return this.publish({ scheduleId, editorId, event: 'schedule_updated', payload });
  }

  async publishStreamAdded(scheduleId: number, editorId: number, payload: StreamAddedPayload) {
    return this.publish({ scheduleId, editorId, event: 'stream_added', payload });
  }

  async publishStreamUpdated(scheduleId: number, editorId: number, payload: StreamUpdatedPayload) {
    return this.publish({ scheduleId, editorId, event: 'stream_updated', payload });
  }

  async publishStreamUpdatedWithDetails(scheduleId: number, editorId: number, payload: StreamUpdatedWithDetailPayload) {
    return this.publish({ scheduleId, editorId, event: 'stream_updated_with_details', payload });
  }

  async publishStreamDeleted(scheduleId: number, editorId: number, payload: StreamDeletedPayload) {
    return this.publish({ scheduleId, editorId, event: 'stream_deleted', payload });
  }

  async publishTagAdded(scheduleId: number, editorId: number, payload: TagAddedPayload) {
    return this.publish({ scheduleId, editorId, event: 'tag_added', payload });
  }

  async publishTagRemoved(scheduleId: number, editorId: number, payload: TagRemovedPayload) {
    return this.publish({ scheduleId, editorId, event: 'tag_removed', payload });
  }

  async publishParticipantAdded(scheduleId: number, editorId: number, payload: ParticipantAddedPayload) {
    return this.publish({ scheduleId, editorId, event: 'participant_added', payload });
  }

  async publishParticipantRemoved(scheduleId: number, editorId: number, payload: ParticipantRemovedPayload) {
    return this.publish({ scheduleId, editorId, event: 'participant_removed', payload });
  }

  async publishDraftPublished(scheduleId: number, editorId: number, payload: DraftPublishedPayload) {
    return this.publish({ scheduleId, editorId, event: 'draft_published', payload });
  }

  async publishDraftDiscarded(scheduleId: number, editorId: number, payload: DraftDiscardedPayload) {
    return this.publish({ scheduleId, editorId, event: 'draft_discarded', payload });
  }

  async publishLock(scheduleId: number, editorId: number, payload: LockPayload) {
    return this.publish({ scheduleId, editorId, event: 'lock', payload });
  }

  async publishUnlock(scheduleId: number, editorId: number, payload: UnlockPayload) {
    return this.publish({ scheduleId, editorId, event: 'unlock', payload });
  }

  private async writeSnapshot(snapshot: InitPayload) {
    await this.ctx.storage.put('snapshot', snapshot);
    await this.ctx.storage.put('snapshotUpdatedAt', Date.now());
  }

  private async publish(event: EditChannelMessage): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), event);
      return new Response('ok');
    } catch (err) {
      console.warn('[ScheduleEditingObject] publish failed', err);
      return new Response('error', {status: 500});
    }
  }
}

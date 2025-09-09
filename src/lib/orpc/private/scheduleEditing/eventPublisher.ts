import {EventPublisher} from '@orpc/server'
import type {
  DraftDiscardedPayload,
  DraftPublishedPayload,
  EditChannelMessage,
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
  ScheduleUpdatedPayload,
  StreamAddedPayload,
  StreamDeletedPayload,
  StreamUpdatedPayload,
  StreamUpdatedWithDetailPayload,
  TagAddedPayload,
  TagRemovedPayload,
} from './scheduleEditingTypes'

class ScheduleEditingEventPublisher extends EventPublisher<{
  edit: EditChannelMessage
}> {
  // Convenience helpers publish to the single 'edit' channel
  scheduleUpdated(scheduleId: number, editorId: number, payload: ScheduleUpdatedPayload) {
    this.publish('edit', { scheduleId, editorId, event: 'schedule_updated', payload: payload  })
  }
  streamAdded(scheduleId: number, editorId: number, stream: StreamAddedPayload) {
    this.publish('edit', { scheduleId, editorId, event: 'stream_added', payload: stream })
  }
  streamUpdated(scheduleId: number, editorId: number, streamId: number, payload?: StreamUpdatedPayload) {
    const typed = payload ?? { id: streamId, patch: {} }
    this.publish('edit', { scheduleId, editorId, event: 'stream_updated', payload: typed })
  }
  streamUpdatedWithDetails(scheduleId: number, editorId: number, payload: StreamUpdatedWithDetailPayload) {
    this.publish('edit', { scheduleId, editorId, event: 'stream_updated_with_details', payload })
  }
  streamDeleted(scheduleId: number, editorId: number, streamId: number, payload?: StreamDeletedPayload) {
    const typed = payload ?? { id: streamId }
    this.publish('edit', { scheduleId, editorId, event: 'stream_deleted', payload: typed })
  }
  tagAdded(scheduleId: number, editorId: number, streamId: number, id: number, payload: TagAddedPayload) {
    this.publish('edit', { scheduleId, editorId, event: 'tag_added', payload: payload })
  }
  tagRemoved(scheduleId: number, editorId: number, streamId: number, id: number, payload?: TagRemovedPayload) {
    const typed = payload ?? { streamId, id }
    this.publish('edit', { scheduleId, editorId, event: 'tag_removed', payload: typed })
  }
  participantAdded(scheduleId: number, editorId: number, streamId: number, userId: number, payload: ParticipantAddedPayload) {
    this.publish('edit', { scheduleId, editorId, event: 'participant_added', payload: payload })
  }
  participantRemoved(scheduleId: number, editorId: number, streamId: number, userId: number, payload?: ParticipantRemovedPayload) {
    const typed = payload ?? { streamId, userId }
    this.publish('edit', { scheduleId, editorId, event: 'participant_removed', payload: typed })
  }
  published(scheduleId: number, editorId: number, payload?: DraftPublishedPayload) {
    const typed = payload ?? {}
    this.publish('edit', { scheduleId, editorId, event: 'draft_published', payload: typed })
  }
  discarded(scheduleId: number, editorId: number, payload?: DraftDiscardedPayload) {
    const typed = payload ?? {}
    this.publish('edit', { scheduleId, editorId, event: 'draft_discarded', payload: typed })
  }
  lock(scheduleId: number, editorId: number, streamId: number, userId: number) {
    this.publish('edit', { scheduleId, editorId, event: 'lock', payload: { streamId, userId } })
  }
  unlock(scheduleId: number, editorId: number, streamId: number, userId: number) {
    this.publish('edit', { scheduleId, editorId, event: 'unlock', payload: { streamId, userId } })
  }
}

export const scheduleEditingEventPublisher = new ScheduleEditingEventPublisher();

import type {
  InitDraftStream,
  InitParticipant,
  InitTag,
} from '../../../../../../../../../lib/orpc/private/scheduleEditing/scheduleEditingTypes.ts'

// UI-local draft types derived from shared canonical shapes
export type LocalDraftStream = Pick<InitDraftStream,
  'id' | 'title' | 'visible' | 'subtitle' | 'description' | 'youtubeVodUrl' | 'twitchVodUrl' | 'start' | 'end'
> // & { start: Date | string; end: Date | string; tempId?: string }

export type DraftTag = InitTag
export type DraftParticipant = InitParticipant

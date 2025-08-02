/**
 * ScheduleEditorTypes.ts
 *
 * This file contains all the type definitions used in the Schedule Editor system.
 * It includes types for both frontend and backend components, as well as the
 * TinyBase store structure used for real-time collaboration.
 */

import { DateTime } from "luxon";
import type { InferSelectModel } from "drizzle-orm";
import { schedulesTable, streamParticipantsTable, streamTagsTable, streamsTable } from "../../../../../lib/db/schema/schema";

// ==========================================
// Database Types
// ==========================================

/**
 * Represents a schedule from the database
 * Type derived from the schedulesTable schema
 */
export type DBSchedule = InferSelectModel<typeof schedulesTable>;

/**
 * Represents a stream from the database
 * Type derived from the streamsTable schema
 */
export type DBStream = InferSelectModel<typeof streamsTable>;

/**
 * Represents a stream tag from the database
 * Type derived from the streamTagsTable schema
 */
export type DBStreamTag = InferSelectModel<typeof streamTagsTable>;

/**
 * Represents a stream participant from the database
 * Type derived from the streamParticipantsTable schema
 */
export type DBStreamParticipant = InferSelectModel<typeof streamParticipantsTable>;

/**
 * Represents a stream with its associated tags and participants
 * Used for comprehensive stream data representation
 */
export type DBStreamWithDetails = DBStream & {
  tags: DBStreamTag[];
  participants: DBStreamParticipant[];
};

// ==========================================
// TinyBase Store Types
// ==========================================

/**
 * Interface representing the streams table in the TinyBase store
 * Maps stream IDs to their properties
 */
export interface StreamsTable {
  [id: string]: {
    /** User ID of the stream creator */
    createdBy: number;
    /** Title of the stream */
    title: string;
    /** Optional subtitle of the stream */
    subtitle: string;
    /** Whether the stream is visible to users */
    visible: boolean;
    /** Detailed description of the stream */
    description: string;
    /** YouTube VOD URL for the stream */
    youtubeVodUrl?: string;
    /** Twitch VOD URL for the stream */
    twitchVodUrl?: string;
    /** ISO string representing the start time of the stream */
    start: string;
    /** ISO string representing the end time of the stream */
    end: string;
  };
}

/**
 * Interface representing the tags table in the TinyBase store
 * Maps tag IDs to their properties
 */
export interface TagsTable {
  [id: string]: {
    /** ID of the stream this tag belongs to */
    streamId: string;
    /** Tag identifier */
    tag: string;
    /** Human-readable label for the tag */
    label: string;
  };
}

/**
 * Interface representing the participants table in the TinyBase store
 * Maps participant IDs to their properties
 */
export interface ParticipantsTable {
  [id: string]: {
    /** ID of the stream this participant belongs to */
    streamId: number;
    /** User ID of the participant */
    userId: number;
    /** Display name of the participant */
    username: string;
  };
}

/**
 * Interface representing the values in the TinyBase store
 * Contains schedule metadata
 */
export interface ScheduleValues {
  /** ID of the schedule */
  id: number;
  /** Title of the schedule */
  title: string;
  /** Slug for the schedule URL */
  slug: string;
  /** Year of the schedule */
  year: number;
  /** Whether the schedule is visible to users */
  visible: boolean;
  /** Whether to automatically add the current user to new streams */
  alwaysAddSelfToStream: boolean;
}

/**
 * Interface representing the complete TinyBase store schema for the Schedule Editor
 */
export interface ScheduleEditorStoreSchema {
  tables: {
    streams: StreamsTable;
    streamTags: TagsTable;
    streamParticipants: ParticipantsTable;
  };
  values: ScheduleValues;
}

// ==========================================
// Frontend Types
// ==========================================

/**
 * Interface representing a tag in the frontend
 */
export interface Tag {
  /** Tag identifier (lowercase, used for matching) */
  tag: string;
  /** Human-readable label for display */
  label: string;
  /** Optional count for suggested tags */
  count?: number;
}

/**
 * Interface representing a participant in the frontend
 */
export interface Participant {
  /** User ID of the participant */
  userId: number;
  /** Display name of the participant */
  name: string;
  /** Service provider (e.g., Twitch, YouTube) */
  provider?: string;
}

/**
 * Interface representing a stream in the frontend
 */
export interface StreamType {
  /** Unique identifier for the stream */
  id: number;
  /** Title of the stream */
  title: string;
  /** Subtitle of the stream */
  subtitle: string;
  /** Detailed description of the stream */
  description: string;
  /** Start time of the stream */
  start: DateTime;
  /** End time of the stream */
  end: DateTime;
  /** Whether the stream is visible to users */
  visible: boolean;
  /** Tags associated with the stream */
  tags: Tag[];
  /** Participants in the stream */
  participants: Participant[];
  /** User ID of the stream creator */
  createdBy: number;
  /** Optional YouTube VOD URL */
  youtubeVodUrl?: string;
  /** Optional Twitch VOD URL */
  twitchVodUrl?: string;
}

/**
 * Interface representing a schedule in the frontend
 */
export interface ScheduleType {
  /** Unique identifier for the schedule */
  id: number;
  /** Title of the schedule */
  title: string;
  /** Year of the schedule */
  year: number;
  /** Slug for the schedule URL */
  slug: string;
  /** Whether the schedule is visible to users */
  visible: boolean;
  /** Streams in the schedule */
  streams: StreamType[];
  /** Whether to automatically add the current user to new streams */
  alwaysAddSelfToStream: boolean;
  /** The initial visibility of a newly created stream */
  defaultStreamVisibility: boolean;
  /** The length of a newly created Stream */
  defaultStreamLength: number;
}

// ==========================================
// Action Types
// ==========================================

/**
 * Defines the structure for tracking the state of all actions in the hook.
 * Each action has:
 * - actionInProgress: Boolean flag indicating if the action is currently executing
 * - lastErrorMessage: Optional string containing the last error message if the action failed
 */
export type HookActions = {
  /** Action state for adding a new stream */
  addNewStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  saveStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamTitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamDescription: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamSubtitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamEnd: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamStart: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleTitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleYear: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleSlug: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateAlwaysAddSelfToStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateDefaultStreamVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateDefaultStreamLength: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addParticipant: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeParticipant: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  saveSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  fetchTags: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

// ==========================================
// Utility Types
// ==========================================

/**
 * Type for values that can be either a direct value or a function that computes a new value from the previous one.
 * This pattern is used in state setters to allow both direct value assignment and computed updates.
 */
export type ValueOrSetter<T> = (T | ((prev: T) => T));

/**
 * Interface for tag search results from the API
 */
export interface TagSearchResults {
  /** Regular tags matching the search criteria */
  tags: Tag[];
  /** Default tags suggested for all streams */
  defaultTags: Tag[];
  /** Charity-specific tags */
  charityTags: Tag[];
}

/**
 * Interface for schedule update operations
 * Used when saving changes to the database
 */
export interface ScheduleUpdateData {
  streams: {
    creates: Array<{
      id: number;
      scheduleId: number;
      title: string;
      subtitle: string;
      description: string;
      visible: boolean;
      createdBy: number;
      youtubeVodUrl: string;
      twitchVodUrl: string;
      start: Date;
      end: Date;
    }>;
    updates: Array<{
      id: number;
      title: string;
      subtitle: string;
      description: string;
      visible: boolean;
      createdBy: number;
      youtubeVodUrl: string;
      twitchVodUrl: string;
      start: Date;
      end: Date;
    }>;
    deletes: number[];
  };
  participants: {
    creates: Array<{
      streamId: number;
      userId: number;
    }>;
    deletes: Array<{
      streamId: number;
      userId: number;
    }>;
  };
  tags: {
    creates: Array<{
      streamId: number;
      tag: string;
      label: string;
    }>;
    deletes: Array<{
      streamId: number;
      tag: string;
    }>;
  };
}

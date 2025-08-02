import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { schedulesTable, streamsTable, streamTagsTable, streamParticipantsTable } from "../schema/jj-schema";
import type { User } from "./user";

/**
 * Schedule entity type from database schema
 */
export type Schedule = InferSelectModel<typeof schedulesTable>;

/**
 * Schedule insert type for creating new schedules
 */
export type ScheduleInsert = InferInsertModel<typeof schedulesTable>;

/**
 * Stream entity type from database schema
 */
export type Stream = InferSelectModel<typeof streamsTable>;

/**
 * Stream insert type for creating new streams
 */
export type StreamInsert = InferInsertModel<typeof streamsTable>;

/**
 * Stream tag entity type from database schema
 */
export type StreamTag = InferSelectModel<typeof streamTagsTable>;

/**
 * Stream tag insert type for creating new stream tags
 */
export type StreamTagInsert = InferInsertModel<typeof streamTagsTable>;

/**
 * Stream participant entity type from database schema
 */
export type StreamParticipant = InferSelectModel<typeof streamParticipantsTable>;

/**
 * Stream participant insert type for creating new stream participants
 */
export type StreamParticipantInsert = InferInsertModel<typeof streamParticipantsTable>;

/**
 * Schedule with streams relationship
 */
export interface ScheduleWithStreams extends Schedule {
  streams: Stream[];
}

/**
 * Schedule with owner information
 */
export interface ScheduleWithOwner extends Schedule {
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

/**
 * Stream with tags relationship
 */
export interface StreamWithTags extends Stream {
  tags: StreamTag[];
}

/**
 * Stream with participants relationship
 */
export interface StreamWithParticipants extends Stream {
  participants: StreamParticipantDisplay[];
}

/**
 * Stream with both tags and participants
 */
export interface DetailedStream extends Stream {
  tags: StreamTag[];
  participants: StreamParticipantDisplay[];
}

/**
 * Schedule with detailed streams (including tags and participants)
 */
export interface ScheduleWithDetailedStreams extends Schedule {
  streams: DetailedStream[];
}

/**
 * Input type for creating a new schedule
 */
export interface ScheduleInput {
  title: string;
  slug: string;
  year: number;
  visible: boolean;
  primary?: boolean;
  ownerId: number;
}

/**
 * Input type for creating a new stream
 */
export interface StreamInput {
  title: string;
  subtitle?: string;
  description?: string;
  start: Date;
  end: Date;
  visible?: boolean;
  youtubeVodUrl?: string;
  twitchVodUrl?: string;
  createdBy: number;
}

/**
 * Input type for updating a schedule with streams
 */
export interface ScheduleUpdateInput {
  title?: string;
  slug?: string;
  year?: number;
  visible?: boolean;
  primary?: boolean;
  streams?: {
    creates?: StreamInput[];
    updates?: Array<{ id: number } & Partial<StreamInput>>;
    deletes?: number[];
  };
  participants?: {
    creates?: Array<{ streamId: number, userId: number }>;
    deletes?: Array<{ streamId: number, userId: number }>;
  };
  tags?: {
    creates?: Array<{ streamId: number, tag: string, label: string }>;
    deletes?: Array<{ streamId: number, tag: string }>;
  };
}

/**
 * Interface representing the structure of the stream_participants_display_view
 * This combines stream participants with user display information
 */
export interface StreamParticipantDisplay {
  streamId: number;
  scheduleId: number;
  userId: number;
  username: string;
  profileImage: string;
}

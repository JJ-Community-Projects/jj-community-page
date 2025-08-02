// src/lib/db/newRepos/schedule/ScheduleRepo.ts
import type {RepoEnv} from "../../RepoEnv";
import { ScheduleSection } from "./sections/ScheduleSection";
import { StreamSection } from "./sections/StreamSection";
import { StreamTagSection } from "./sections/StreamTagSection";
import { StreamParticipantSection } from "./sections/StreamParticipantSection";
import { EditorSection } from "./sections/EditorSection";
import type {
  Schedule,
  ScheduleInsert,
  ScheduleUpdateInput,
  ScheduleWithDetailedStreams,
  DetailedStream,
  Stream,
  StreamInsert,
  StreamTag,
  StreamTagInsert,
  StreamParticipant,
  StreamParticipantInsert,
  StreamParticipantDisplay
} from "../../types/schedule";
import { NotFoundError } from "../../../db/errors";
// @ts-ignore
import type {ActionAPIContext} from "astro:actions";
import {BaseRepo} from "../../repos/BaseRepo";

/**
 * Repository for schedule domain operations
 * Coordinates between schedule-related sections
 */
export class ScheduleRepo extends BaseRepo {
  private scheduleSection: ScheduleSection;
  private streamSection: StreamSection;
  private streamTagSection: StreamTagSection;
  private streamParticipantSection: StreamParticipantSection;
  private editorSection: EditorSection;

  /**
   * Creates a new ScheduleRepo instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.scheduleSection = new ScheduleSection(env, repoEnv);
    this.streamSection = new StreamSection(env, repoEnv);
    this.streamTagSection = new StreamTagSection(env, repoEnv);
    this.streamParticipantSection = new StreamParticipantSection(env, repoEnv);
    this.editorSection = new EditorSection(env, repoEnv);
  }

  /**
   * Creates a ScheduleRepo instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A ScheduleRepo instance
   */
  static action(ctx: ActionAPIContext) {
    return new ScheduleRepo(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets the schedule section
   * @returns The schedule section
   */
  getScheduleSection(): ScheduleSection {
    return this.scheduleSection;
  }

  /**
   * Gets the stream section
   * @returns The stream section
   */
  getStreamSection(): StreamSection {
    return this.streamSection;
  }

  /**
   * Gets the stream tag section
   * @returns The stream tag section
   */
  getStreamTagSection(): StreamTagSection {
    return this.streamTagSection;
  }

  /**
   * Gets the stream participant section
   * @returns The stream participant section
   */
  getStreamParticipantSection(): StreamParticipantSection {
    return this.streamParticipantSection;
  }

  /**
   * Gets the editor section
   * @returns The editor section
   */
  getEditorSection(): EditorSection {
    return this.editorSection;
  }

  /**
   * Finds a schedule with all its streams, tags, and participants
   * @param id - The ID of the schedule to find
   * @returns The schedule with detailed streams
   */
  async findScheduleWithDetailedStreams(id: number): Promise<ScheduleWithDetailedStreams | undefined> {
    try {
      // Get the schedule
      const schedule = await this.scheduleSection.findById(id);
      if (!schedule) {
        return undefined;
      }

      // Get the streams
      const streams = await this.streamSection.findByScheduleId(id);

      // Get the detailed streams
      const detailedStreams: DetailedStream[] = await Promise.all(
        streams.map(async (stream) => {
          const tags = await this.streamTagSection.findByStreamId(id, stream.id);
          const participants = await this.streamParticipantSection.findStreamParticipantDisplayByStreamId(id, stream.id);

          return {
            ...stream,
            tags,
            participants
          };
        })
      );

      return {
        ...schedule,
        streams: detailedStreams
      };
    } catch (error) {
      this.handleError(`Failed to find schedule with detailed streams: ${id}`, error);
    }
  }

  /**
   * Creates a schedule with streams, tags, and participants
   * @param data - The schedule data
   * @param streams - The stream data
   * @returns The created schedule
   */
  async createScheduleWithStreams(
    data: ScheduleInsert,
    streams: {
      stream: Omit<StreamInsert, 'scheduleId'>,
      tags?: Omit<StreamTagInsert, 'scheduleId' | 'streamId'>[],
      participants?: Omit<StreamParticipantInsert, 'scheduleId' | 'streamId'>[]
    }[]
  ): Promise<Schedule> {
    try {
      // Create the schedule
      const schedule = await this.scheduleSection.create(data);

      // Create the streams, tags, and participants
      for (const { stream, tags, participants } of streams) {
        // Get the next stream ID
        const streamId = await this.streamSection.getNextStreamId(schedule.id);

        // Create the stream
        const createdStream = await this.streamSection.create({
          ...stream,
          id: streamId,
          scheduleId: schedule.id
        });

        // Create tags
        if (tags && tags.length > 0) {
          for (const tag of tags) {
            await this.streamTagSection.create({
              ...tag,
              scheduleId: schedule.id,
              streamId: createdStream.id
            });
          }
        }

        // Create participants
        if (participants && participants.length > 0) {
          for (const participant of participants) {
            await this.streamParticipantSection.create({
              ...participant,
              scheduleId: schedule.id,
              streamId: createdStream.id
            });
          }
        }
      }

      return schedule;
    } catch (error) {
      this.handleError("Failed to create schedule with streams", error);
    }
  }

  /**
   * Updates a schedule with streams, tags, and participants
   * @param id - The ID of the schedule to update
   * @param data - The update data
   * @returns The updated schedule
   */
  async updateScheduleWithStreams(id: number, data: ScheduleUpdateInput): Promise<Schedule> {
    try {
      // Update the schedule
      let schedule: Schedule;
      if (data.title || data.slug || data.year || data.visible !== undefined || data.primary !== undefined) {
        schedule = await this.scheduleSection.update(id, {
          title: data.title,
          slug: data.slug,
          year: data.year,
          visible: data.visible,
          primary: data.primary
        });
      } else {
        const existingSchedule = await this.scheduleSection.findById(id);
        if (!existingSchedule) {
          throw new NotFoundError(`Schedule with id ${id} not found`);
        }
        schedule = existingSchedule;
      }

      // Handle streams
      if (data.streams) {
        // Create new streams
        if (data.streams.creates && data.streams.creates.length > 0) {
          for (const streamData of data.streams.creates) {
            // Get the next stream ID
            const streamId = await this.streamSection.getNextStreamId(id);

            await this.streamSection.create({
              ...streamData,
              id: streamId,
              scheduleId: id
            });
          }
        }

        // Update existing streams
        if (data.streams.updates && data.streams.updates.length > 0) {
          for (const { id: streamId, ...streamData } of data.streams.updates) {
            await this.streamSection.update(id, streamId, streamData);
          }
        }

        // Delete streams
        if (data.streams.deletes && data.streams.deletes.length > 0) {
          for (const streamId of data.streams.deletes) {
            await this.streamSection.delete(id, streamId);
          }
        }
      }

      // Handle participants
      if (data.participants) {
        // Create new participants
        if (data.participants.creates && data.participants.creates.length > 0) {
          for (const { streamId, userId } of data.participants.creates) {
            await this.streamParticipantSection.create({
              scheduleId: id,
              streamId,
              userId
            });
          }
        }

        // Delete participants
        if (data.participants.deletes && data.participants.deletes.length > 0) {
          for (const { streamId, userId } of data.participants.deletes) {
            await this.streamParticipantSection.deleteByStreamAndUser(id, streamId, userId);
          }
        }
      }

      // Handle tags
      if (data.tags) {
        // Create new tags
        if (data.tags.creates && data.tags.creates.length > 0) {
          for (const { streamId, tag, label } of data.tags.creates) {
            await this.streamTagSection.create({
              scheduleId: id,
              streamId,
              tag,
              label
            });
          }
        }

        // Delete tags
        if (data.tags.deletes && data.tags.deletes.length > 0) {
          for (const { streamId, tag } of data.tags.deletes) {
            await this.streamTagSection.deleteByStreamAndTag(id, streamId, tag);
          }
        }
      }

      return schedule;
    } catch (error) {
      this.handleError(`Failed to update schedule with streams: ${id}`, error);
    }
  }

  /**
   * Deletes a schedule and all its related data
   * @param id - The ID of the schedule to delete
   */
  async deleteScheduleWithStreams(id: number): Promise<void> {
    try {
      // Due to cascade delete in the database schema, deleting the schedule
      // will automatically delete all related streams, tags, and participants
      await this.scheduleSection.delete(id);
    } catch (error) {
      this.handleError(`Failed to delete schedule with streams: ${id}`, error);
    }
  }

  /**
   * Adds an editor to a schedule
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user to add as an editor
   */
  async addEditor(scheduleId: number, userId: number): Promise<void> {
    try {
      // Check if the schedule exists
      const schedule = await this.scheduleSection.findById(scheduleId);
      if (!schedule) {
        throw new NotFoundError(`Schedule with id ${scheduleId} not found`);
      }

      // Check if the user is already an editor
      const isEditor = await this.editorSection.isEditor(scheduleId, userId);
      if (isEditor) {
        return; // User is already an editor, nothing to do
      }

      // Add the user as an editor
      await this.editorSection.create({
        scheduleId,
        userId
      });
    } catch (error) {
      this.handleError(`Failed to add editor ${userId} to schedule ${scheduleId}`, error);
    }
  }

  /**
   * Removes an editor from a schedule
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user to remove as an editor
   */
  async removeEditor(scheduleId: number, userId: number): Promise<void> {
    try {
      // Check if the user is an editor
      const isEditor = await this.editorSection.isEditor(scheduleId, userId);
      if (!isEditor) {
        return; // User is not an editor, nothing to do
      }

      // Remove the user as an editor
      await this.editorSection.delete(scheduleId, userId);
    } catch (error) {
      this.handleError(`Failed to remove editor ${userId} from schedule ${scheduleId}`, error);
    }
  }

  /**
   * Checks if a user is an editor or owner of a schedule
   * @param scheduleId - The ID of the schedule
   * @param userId - The ID of the user
   * @returns True if the user is an editor or owner
   */
  async canEditSchedule(scheduleId: number, userId: number): Promise<boolean> {
    try {
      // Check if the schedule exists
      const schedule = await this.scheduleSection.findById(scheduleId);
      if (!schedule) {
        return false;
      }

      // Check if the user is the owner
      if (schedule.ownerId === userId) {
        return true;
      }

      // Check if the user is an editor
      return await this.editorSection.isEditor(scheduleId, userId);
    } catch (error) {
      this.handleError(`Failed to check if user ${userId} can edit schedule ${scheduleId}`, error);
    }
  }

  /**
   * Finds streams with details (tags and participants)
   * @param scheduleId - The ID of the schedule
   * @returns An array of detailed streams
   */
  async findStreamsWithDetails(scheduleId: number): Promise<DetailedStream[]> {
    try {
      // Get the streams
      const streams = await this.streamSection.findByScheduleId(scheduleId);

      // Get the detailed streams
      return await Promise.all(
        streams.map(async (stream) => {
          const tags = await this.streamTagSection.findByStreamId(scheduleId, stream.id);
          const participants = await this.streamParticipantSection.findStreamParticipantDisplayByStreamId(scheduleId, stream.id);

          return {
            ...stream,
            tags,
            participants
          };
        })
      );
    } catch (error) {
      this.handleError(`Failed to find streams with details for schedule: ${scheduleId}`, error);
    }
  }
}

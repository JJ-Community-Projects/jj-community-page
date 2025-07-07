import {Repo, type RepoEnv} from "./Repo.ts";
import {streamParticipantsTable, twitchChannelSchema, twitchStreamSchema, users} from "../schema/schema.ts";
import {accounts, userStyles} from "../schema/auth-schema.ts";
import {and, eq, type InferSelectModel} from "drizzle-orm";
import {DatabaseError} from "./DatabaseError.ts";
import type {BatchItem} from "drizzle-orm/batch";
import type {ActionAPIContext} from "astro:actions";
import type {ParticipantUI} from "../models/schedule-ui.ts";
import type {TiltifyUserData} from "../../TiltifyAPI.ts";
import type {UserProfileImages} from "../models/user-ui.ts";

export class StreamParticipantsRepo extends Repo<typeof streamParticipantsTable._['config']> {

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv, streamParticipantsTable);
    this.env = env;
  }

  static action(ctx: ActionAPIContext) {
    return new StreamParticipantsRepo(ctx.locals.runtime.env, 'action')
  }

  /**
   * Find participants for a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of stream participants
   *
   * SQL: `SELECT * FROM "streamParticipants" WHERE ("streamParticipants"."streamId" = ? AND "streamParticipants"."scheduleId" = ?)`
   */
  async findStreamParticipants(streamId: number, scheduleId: number): Promise<InferSelectModel<typeof streamParticipantsTable>[]> {
    try {
      return await this.db.select()
        .from(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.scheduleId, scheduleId)
        ))
        .all();
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find participants for stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find participants for stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Add a participant to a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param userId The user ID to add as a participant
   * @returns Promise resolving to the created participant
   *
   * SQL: `INSERT INTO "streamParticipants" ("streamId", "scheduleId", "userId") VALUES (?, ?, ?) RETURNING *`
   */
  async addStreamParticipant(streamId: number, scheduleId: number, userId: number): Promise<InferSelectModel<typeof streamParticipantsTable>> {
    try {
      const [result] = await this.db.insert(streamParticipantsTable)
        .values({
          streamId,
          scheduleId,
          userId
        })
        .returning();

      return result;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to add participant: ${userId} to stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to add participant: ${userId} to stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Remove a participant from a stream
   * @param streamId The stream ID
   * @param scheduleId The schedule ID
   * @param userId The user ID to remove as a participant
   * @returns Promise resolving to a boolean indicating if the participant was removed
   *
   * SQL: `DELETE FROM "streamParticipants" WHERE ("streamParticipants"."streamId" = ? AND "streamParticipants"."scheduleId" = ? AND "streamParticipants"."userId" = ?) RETURNING *`
   */
  async removeStreamParticipant(streamId: number, scheduleId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.db.delete(streamParticipantsTable)
        .where(and(
          eq(streamParticipantsTable.streamId, streamId),
          eq(streamParticipantsTable.scheduleId, scheduleId),
          eq(streamParticipantsTable.userId, userId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to remove participant: ${userId} from stream: ${streamId} in schedule: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to remove participant: ${userId} from stream: ${streamId} in schedule: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Add multiple participants to streams in a single batch operation
   * @param participants Array of participant objects with streamId, scheduleId, and userId
   * @returns Promise resolving when the operation is complete
   */
  async bulkAddStreamParticipants(participants?: Array<{
    streamId: number,
    scheduleId: number,
    userId: number
  }>): Promise<void> {
    try {
      if (!participants || participants.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = participants.map(participant => {
        return this.db.insert(streamParticipantsTable)
          .values({
            streamId: participant.streamId,
            scheduleId: participant.scheduleId,
            userId: participant.userId
          });
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to bulk add stream participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk add stream participants", error);
      }
    }
  }

  /**
   * Remove multiple participants from streams in a single batch operation
   * @param participants Array of participant objects with streamId, scheduleId, and userId
   * @returns Promise resolving when the operation is complete
   */
  async bulkRemoveStreamParticipants(participants?: Array<{
    streamId: number,
    scheduleId: number,
    userId: number
  }>): Promise<void> {
    try {
      if (!participants || participants.length === 0) return;

      const operations: BatchItem<'sqlite'>[] = participants.map(participant => {
        return this.db.delete(streamParticipantsTable)
          .where(and(
            eq(streamParticipantsTable.streamId, participant.streamId),
            eq(streamParticipantsTable.scheduleId, participant.scheduleId),
            eq(streamParticipantsTable.userId, participant.userId)
          ));
      });

      await this.executeBatch(operations);
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to bulk remove stream participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk remove stream participants", error);
      }
    }
  }

  /**
   * Bulk write participants (create, delete) in a single batch operation
   *
   * This method combines participant creation and deletion into a single batch operation
   * for improved performance and atomicity. It uses the helper methods getParticipantCreateOps
   * and getParticipantDeleteOps to generate the database operations.
   *
   * @param writes Object containing scheduleId, participants to create and delete
   * @returns Promise resolving when the operation is complete
   */
  async bulkWriteParticipants(writes: {
    scheduleId: number,
    createParticipants?: Array<{ streamId: number, userId: number }>,
    deleteParticipants?: Array<{ streamId: number, userId: number }>,
  }): Promise<void> {
    try {
      const {scheduleId, createParticipants, deleteParticipants} = writes;

      // Collect all operations using the helper methods
      const operations: BatchItem<'sqlite'>[] = [
        ...this.getParticipantCreateOps(scheduleId, createParticipants),
        ...this.getParticipantDeleteOps(scheduleId, deleteParticipants)
      ];

      // Execute all operations in a single batch
      await this.executeBatch(operations);
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError("Failed to bulk write participants", error).toActionError();
      } else {
        throw new DatabaseError("Failed to bulk write participants", error);
      }
    }
  }

  /**
   * Generates database operations for creating participants
   *
   * This function takes an array of participant objects to create and generates the corresponding
   * database operations. It ensures the correct scheduleId is set for each participant.
   *
   * @param scheduleId The ID of the schedule these participants belong to
   * @param createParticipants Array of participant objects to create
   * @returns Array of database operations for batch execution
   */
  getParticipantCreateOps(scheduleId: number, createParticipants?: Array<{
    streamId: number,
    userId: number
  }>): BatchItem<'sqlite'>[] {
    if (!createParticipants) return [];

    const operations: BatchItem<'sqlite'>[] = [];

    // Process participant creations
    for (const participant of createParticipants) {
      operations.push(
        this.db.insert(streamParticipantsTable)
          .values({
            streamId: participant.streamId,
            scheduleId,
            userId: participant.userId
          }).onConflictDoNothing()
      );
    }
    return operations;
  }

  /**
   * Generates database operations for deleting participants
   *
   * This function takes an array of participant objects to delete and generates the corresponding
   * database operations. It ensures deletions are applied only to participants with the correct
   * scheduleId, streamId, and userId.
   *
   * @param scheduleId The ID of the schedule these participants belong to
   * @param deleteParticipants Array of participant objects to delete
   * @returns Array of database operations for batch execution
   */
  getParticipantDeleteOps(scheduleId: number, deleteParticipants?: Array<{
    streamId: number,
    userId: number
  }>): BatchItem<'sqlite'>[] {
    if (!deleteParticipants) return [];

    const operations: BatchItem<'sqlite'>[] = [];

    // Process participant deletions
    for (const participant of deleteParticipants) {
      operations.push(
        this.db.delete(streamParticipantsTable)
          .where(and(
            eq(streamParticipantsTable.streamId, participant.streamId),
            eq(streamParticipantsTable.scheduleId, scheduleId),
            eq(streamParticipantsTable.userId, participant.userId)
          ))
      );
    }
    return operations;
  }


  getStreamParticipantsOperations(scheduleId: number, ops?: {
    creates?: Array<{
      streamId: number,
      userId: number
    }>,
    deletes?: Array<{
      streamId: number,
      userId: number
    }>
  }): BatchItem<'sqlite'>[] {
    return [
      ...this.getParticipantCreateOps(scheduleId, ops?.creates),
      ...this.getParticipantDeleteOps(scheduleId, ops?.deletes)
    ];
  }

  async findParticipantsGroupedByStream(scheduleId: number): Promise<Record<number, InferSelectModel<typeof streamParticipantsTable>[]>> {
    try {
      // Get all participants for all streams in the schedule in one query
      const allParticipants = await this.db.select()
        .from(streamParticipantsTable)
        .where(eq(streamParticipantsTable.scheduleId, scheduleId))
        .all();

      // Organize participants by streamId for efficient lookup
      const participantsByStreamId: Record<number, InferSelectModel<typeof streamParticipantsTable>[]> = {};

      // Group participants by streamId
      for (const participant of allParticipants) {
        if (!participantsByStreamId[participant.streamId]) {
          participantsByStreamId[participant.streamId] = [];
        }
        participantsByStreamId[participant.streamId].push(participant);
      }

      return participantsByStreamId;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find participants grouped by stream for schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find participants grouped by stream for schedule ID: ${scheduleId}`, error);
      }
    }
  }

  /**
   * Find all users that are part of a stream in a schedule
   * @param scheduleId The schedule ID
   * @returns Promise resolving to an array of users who are participants in any stream in the schedule
   *
   * SQL: `SELECT * FROM "users" INNER JOIN "stream_participants" ON "stream_participants"."userId" = "users"."id" WHERE "stream_participants"."scheduleId" = ?`
   */
  findUsersBySchedule(scheduleId: number) {
    return this.db.select({
      id: users.id,
      streamId: streamParticipantsTable.streamId,
      primaryLiveStream: users.primaryLiveStream,
    })
      .from(users)
      .innerJoin(
        streamParticipantsTable,
        eq(streamParticipantsTable.userId, users.id)
      )
      .where(eq(streamParticipantsTable.scheduleId, scheduleId))
      .all();
  }

  findTiltifyAccountsBySchedule(scheduleId: number) {
    return this.db.select({
      userId: accounts.userId,
      name: accounts.providerUsername,
      meta: accounts.meta,
      streamId: streamParticipantsTable.streamId,
    })
      .from(accounts)
      .innerJoin(
        streamParticipantsTable,
        eq(streamParticipantsTable.userId, accounts.userId)
      )
      .where(
        and(
          eq(accounts.provider, 'tiltify'),
          eq(streamParticipantsTable.scheduleId, scheduleId)
        )
      )
      .all().then((accounts) => {
        return accounts.map((account) => {
          return {
            ...account,
            meta: account.meta ? account.meta as TiltifyUserData : null,
          }
        })
      });
  }

  findUserStyleBySchedule(scheduleId: number) {
    return this.db.select({
      userId: userStyles.userId,
      primaryColor: userStyles.primaryColor,
      accentColor: userStyles.accentColor,
      streamId: streamParticipantsTable.streamId,
    }).from(userStyles)
      .innerJoin(
        streamParticipantsTable,
        eq(streamParticipantsTable.userId, userStyles.userId)
      )
      .where(
        eq(streamParticipantsTable.scheduleId, scheduleId)
      )
      .all()
  }

  findTwitchChannelBySchedule(scheduleId: number) {
    return this.db.select().from(twitchChannelSchema)
      .innerJoin(
        streamParticipantsTable,
        eq(streamParticipantsTable.userId, twitchChannelSchema.userId)
      ).leftJoin(twitchStreamSchema, eq(twitchChannelSchema.id, twitchStreamSchema.twitchId))
      .where(
        eq(streamParticipantsTable.scheduleId, scheduleId)
      )
      .all()
  }


  async findParticipantsUIByStream(scheduleId: number): Promise<Record<number, ParticipantUI[]>> {
    try {
      // Get data from the three required methods
      const users = await this.findUsersBySchedule(scheduleId);
      const tiltifyAccounts = await this.findTiltifyAccountsBySchedule(scheduleId);
      const userStyles = await this.findUserStyleBySchedule(scheduleId);
      const twitchChannels = await this.findTwitchChannelBySchedule(scheduleId);
      console.log('findParticipantsUIByStream', 'twitchChannels', twitchChannels)
      // Create maps for efficient lookups
      // const userMap = new Map(users.map(user => [user.id, user]));
      const tiltifyMap = new Map(tiltifyAccounts.map(account => [account.userId, account]));
      const styleMap = new Map(userStyles.map(style => [style.userId, style]));
      const twitchMap = new Map(twitchChannels.map(channel => [channel.stream_participants.userId, channel]));

      // Organize participants by streamId
      const participantsByStreamId: Record<number, ParticipantUI[]> = {};

      // Process all users to create ParticipantUIV2 objects
      for (const user of users) {
        if (!participantsByStreamId[user.streamId]) {
          participantsByStreamId[user.streamId] = [];
        }

        const tiltifyAccount = tiltifyMap.get(user.id);
        const userStyle = styleMap.get(user.id);
        const twitchChannel = twitchMap.get(user.id);

        const isLiveOnTwitch = twitchChannel?.twitch_streams !== null

        const img: UserProfileImages = {
          default: '',
          mobile: ''
        }

        if (twitchChannel?.twitch_channels) {
          img.default = twitchChannel.twitch_channels.profileImageUrl ?? ''
          img.mobile = twitchChannel.twitch_channels.profileImageUrl?.replace('300x300', '70x70') ?? ''
        } else if (tiltifyAccount?.meta?.avatar) {
          img.default = tiltifyAccount?.meta?.avatar.src ?? '';
          img.mobile = tiltifyAccount?.meta?.avatar.src ?? '';
        }

        // Create the ParticipantUIV2 object
        const participantUI: ParticipantUI = {
          id: user.id,
          label: tiltifyAccount?.name || `User ${user.id}`,
          style: {
            primaryColor: userStyle?.primaryColor || '#E30E50',
            accentColor: userStyle?.accentColor || '#3584BF',
            profileImage: img
          },
          liveState: {
            id: user.id,
            name: tiltifyAccount?.name || `User ${user.id}`,
            slug: tiltifyAccount?.meta?.slug || `user-${user.id}`,
            isLive: isLiveOnTwitch,
            primaryLiveStream: user.primaryLiveStream || '',
            channel: {
              twitch: isLiveOnTwitch ? twitchChannel?.twitch_channels : undefined,
            }
          }
        };

        participantsByStreamId[user.streamId].push(participantUI);
      }

      return participantsByStreamId;
    } catch (error) {
      if (this.isAction()) {
        throw new DatabaseError(`Failed to find ParticipantUIV2 grouped by stream for schedule ID: ${scheduleId}`, error).toActionError();
      } else {
        throw new DatabaseError(`Failed to find ParticipantUIV2 grouped by stream for schedule ID: ${scheduleId}`, error);
      }
    }
  }
}

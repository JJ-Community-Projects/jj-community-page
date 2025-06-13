import {type Id, type IdAddedOrRemoved, type TablesSchema, type ValuesSchema} from 'tinybase';
import {schedulesTable, streamParticipantsTable, streamTagsTable, streamsTable} from "../lib/db/schema/schema";
import {drizzle, type DrizzleD1Database} from "drizzle-orm/d1";
import {and, eq, sql} from "drizzle-orm";
import {DateTime} from "luxon";
import type {BatchItem} from "drizzle-orm/batch";
import {TinybaseDO} from "./TinybaseDO.ts";
import type {MergeableStore} from "tinybase/mergeable-store";


export class ScheduleEditorDO extends TinybaseDO {

  protected namespace(): string {
    return 'ScheduleEditorDO'
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.ctx.blockConcurrencyWhile(async () => {
      await this.init()
    })
  }

  private get scheduleId() {
    return parseInt(this.ctx.id.name!)
  }

  private async init() {
    await this.loadFromDB()
  }

  onPathId(pathId: Id, addedOrRemoved: IdAddedOrRemoved) {
    console.info((addedOrRemoved ? 'Added' : 'Removed') + ` path ${pathId}`);
  }

  onClientId(pathId: Id, clientId: Id, addedOrRemoved: IdAddedOrRemoved) {
    console.info(
      (addedOrRemoved ? 'Added' : 'Removed') +
      ` client ${clientId} on path ${pathId}`,
    );
  }


  async onMessage(fromClientId: Id, toClientId: Id, message: string) {
    console.info('Message received on path: ', this.getPathId());
    console.log('ScheduleEditorDO', 'onMessage', fromClientId, toClientId, message);

    super.onMessage(fromClientId, toClientId, message)

    const lst = await this.ctx.storage.list()
    console.log('lst', lst)
  }


  getTables() {
    const tables = this.persister?.getStore().getTables()
    console.log('ScheduleEditorDO', 'getTables', tables)
    return tables;
  }


  /**
   * Loads the schedule and streams and stores them in the persisters store
   */
  async loadFromDB() {
    const id = this.scheduleId
    const db = drizzle(this.env.DB);

    // Load data from database
    const schedule = await this.loadScheduleFromDB(db, id);
    if (!schedule) {
      return;
    }

    const streams = await this.loadStreamsFromDB(db, id);
    const tags = await this.loadTagsFromDB(db, id);
    const participants = await this.loadParticipantsFromDB(db, id);

    const store = this.store;
    if (!store) {
      return;
    }

    // Set schedule values in store
    this.setScheduleValuesInStore(store, schedule);

    // Process data and set in store
    const tinyStreamsTable = this.processStreamsForStore(streams);
    const tagsTable = this.processTagsForStore(tags);
    const participantsTable = this.processParticipantsForStore(participants);

    // Set all tables in the store
    store.setTable('streams', tinyStreamsTable);
    store.setTable('streamTags', tagsTable);
    store.setTable('streamParticipants', participantsTable);
  }

  /**
   * Loads schedule data from the database
   */
  private async loadScheduleFromDB(db: any, id: number) {
    return await db.select().from(schedulesTable)
      .where(eq(schedulesTable.id, id))
      .get();
  }

  /**
   * Loads streams data from the database
   */
  private async loadStreamsFromDB(db: any, id: number) {
    return await db.select().from(streamsTable)
      .where(eq(streamsTable.scheduleId, id))
      .all();
  }

  /**
   * Loads tags data from the database
   */
  private async loadTagsFromDB(db: any, id: number) {
    return await db.select().from(streamTagsTable)
      .where(eq(streamTagsTable.scheduleId, id))
      .all();
  }

  /**
   * Loads participants data from the database
   */
  private async loadParticipantsFromDB(db: any, id: number) {
    return await db.select({
      scheduleId: streamParticipantsTable.scheduleId,
      streamId: streamParticipantsTable.streamId,
      userId: streamParticipantsTable.userId,
    })
      .from(streamParticipantsTable)
      .where(eq(streamParticipantsTable.scheduleId, id))
      .all();
  }

  /**
   * Sets schedule values in the store
   */
  private setScheduleValuesInStore(store: MergeableStore, schedule: any) {
    store.setValue('id', schedule.id);
    store.setValue('title', schedule.title);
    store.setValue('slug', schedule.slug);
    store.setValue('year', schedule.year);
    store.setValue('visible', schedule.visible);
  }

  /**
   * Processes streams data for the store
   */
  private processStreamsForStore(streams: any[]) {
    const tinyStreamsTable: {
      [id: string]: {
        createdBy: number
        title: string
        subtitle: string
        visible: boolean
        description: string
        start: string
        end: string,
      }
    } = {};

    for (const stream of streams) {
      tinyStreamsTable[`${stream.id}`] = {
        createdBy: stream.createdBy,
        title: stream.title,
        subtitle: stream.subtitle ?? '',
        description: stream.description ?? '',
        visible: stream.visible,
        start: stream.start.toISOString(),
        end: stream.end.toISOString()
      };
    }

    return tinyStreamsTable;
  }

  /**
   * Processes tags data for the store
   */
  private processTagsForStore(tags: any[]) {
    const tagsTable: {
      [id: string]: {
        streamId: string
        tag: string
        label: string
      }
    } = {};

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      tagsTable[`${i}`] = {
        streamId: tag.streamId.toString(),
        tag: tag.tag,
        label: tag.label || tag.tag // Use label if available, otherwise fallback to tag
      };
    }

    return tagsTable;
  }

  /**
   * Processes participants data for the store
   */
  private processParticipantsForStore(participants: any[]) {
    const participantsTable: {
      [id: string]: {
        streamId: string
        userId: number
        providerName: string
        provider: string
      }
    } = {};

    // Note: We only store the basic participant info here
    // The UI will need to fetch additional user details as needed
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      participantsTable[`${i}`] = {
        streamId: participant.streamId.toString(),
        userId: participant.userId,
        providerName: "", // These will be populated by the UI when displaying participants
        provider: ""
      };
    }

    return participantsTable;
  }

  /**
   * Writes the state from the persister store to D1
   * This method synchronizes the TinyBase store data with the Cloudflare D1 database
   * by performing updates, inserts, and deletes as needed for schedules, streams, and tags.
   */
  async saveToDB() {
    // Initialize the database connection using Drizzle ORM
    const db = drizzle(this.env.DB);

    // Get the TinyBase store and verify it exists
    const store = this.store
    if (!store) {
      return // Exit if store is not available
    }

    // Get the schedule ID from the store
    const scheduleId = store.getValue('id') as number

    // Start building a batch of database operations
    // First operation: Update the schedule information in the database
    const batch: BatchItem<'sqlite'>[] = [
      this.createScheduleUpdateOperation(db, store, scheduleId)
    ]

    // Fetch existing data from the database
    const { dbStreams, dbTags, dbParticipants } = await this.fetchExistingDataFromDB(db, scheduleId);

    // Get data from the store
    const { storeStreams, storeTags, storeParticipants } = this.getDataFromStore(store);

    // Extract IDs for comparison between store and database
    const storeStreamIds = Object.keys(storeStreams);
    const dbStreamIds = dbStreams.map((stream) => stream.id.toString());

    // Generate operations for streams
    const streamUpdates = this.generateStreamUpdates(db, storeStreams, storeStreamIds, dbStreamIds, scheduleId);
    const streamInserts = this.generateStreamInserts(db, storeStreams, storeStreamIds, dbStreamIds, scheduleId);
    const streamDeletes = this.generateStreamDeletes(db, dbStreamIds, storeStreamIds, scheduleId);

    // Handle tag operations
    const { tagInserts, tagDeletes } = this.handleTagOperations(
      db, dbTags, storeTags, storeStreamIds, scheduleId
    );

    // Handle participant operations
    const { participantInserts, participantDeletes } = this.handleParticipantOperations(
      db, dbParticipants, storeParticipants, storeStreamIds, scheduleId
    );

    // Add all operations to the batch array
    batch.push(
      ...streamUpdates,
      ...streamInserts,
      ...streamDeletes,
      ...tagInserts,
      ...tagDeletes,
      ...participantInserts,
      ...participantDeletes
    );

    // Execute the batch operations
    await this.executeBatchOperations(db, batch);
  }

  /**
   * Creates the schedule update operation
   */
  private createScheduleUpdateOperation(db: DrizzleD1Database, store: MergeableStore, scheduleId: number) {
    return db.update(schedulesTable).set({
      title: store.getValue('title') as string,
      slug: store.getValue('slug') as string,
      year: store.getValue('year') as number,
      visible: store.getValue('visible') as boolean,
      updatedAt: DateTime.now().toUTC().toJSDate(), // Set the current time as update timestamp
    }).where(eq(schedulesTable.id, scheduleId));
  }

  /**
   * Fetches existing data from the database
   */
  private async fetchExistingDataFromDB(db: DrizzleD1Database, scheduleId: number) {
    // Fetch all existing streams for this schedule from the database
    const dbStreams = await db.select().from(streamsTable)
      .where(eq(streamsTable.scheduleId, scheduleId))
      .all();

    // Get current tags from database for this schedule
    const dbTags = await db.select().from(streamTagsTable)
      .where(eq(streamTagsTable.scheduleId, scheduleId))
      .all();

    // Get current participants from database for this schedule
    const dbParticipants = await db.select().from(streamParticipantsTable)
      .where(eq(streamParticipantsTable.scheduleId, scheduleId))
      .all();

    return { dbStreams, dbTags, dbParticipants };
  }

  /**
   * Gets data from the store
   */
  private getDataFromStore(store: MergeableStore) {
    // Get streams from the TinyBase store
    const storeStreams = store.getTable('streams') as {
      [id: string]: {
        createdBy: number
        title: string
        subtitle: string
        visible: boolean
        description: string
        start: string
        end: string
      }
    };
    this.log(storeStreams); // Log streams for debugging purposes

    // Get tags from the streamTags table in the TinyBase store
    const storeTags = store.getTable('streamTags') as {
      [id: string]: {
        streamId: string
        tag: string
        label: string
      }
    };

    // Get participants from the streamParticipants table in the TinyBase store
    const storeParticipants = store.getTable('streamParticipants') as {
      [id: string]: {
        streamId: string
        userId: number
        providerName: string
        provider: string
      }
    } || {};

    return { storeStreams, storeTags, storeParticipants };
  }

  /**
   * Generates stream update operations
   */
  private generateStreamUpdates(db: any, storeStreams: any, storeStreamIds: string[], dbStreamIds: string[], scheduleId: number) {
    return storeStreamIds
      .filter(id => dbStreamIds.includes(id)) // Only update existing streams
      .map((id) => {
        const storeStream = storeStreams[id];
        return db.update(streamsTable)
          .set({
            title: storeStream.title,
            subtitle: storeStream.subtitle ?? '',
            description: storeStream.description ?? '',
            visible: storeStream.visible,
            createdBy: storeStream.createdBy,
            start: DateTime.fromISO(storeStream.start).toUTC().toJSDate(),
            end: DateTime.fromISO(storeStream.end).toUTC().toJSDate()
          })
          .where(and(
            eq(streamsTable.id, parseInt(id)),
            eq(streamsTable.scheduleId, scheduleId)
          ));
      });
  }

  /**
   * Generates stream insert operations
   */
  private generateStreamInserts(db: any, storeStreams: any, storeStreamIds: string[], dbStreamIds: string[], scheduleId: number) {
    return storeStreamIds
      .filter(id => !dbStreamIds.includes(id)) // Only insert new streams
      .map((id) => {
        const storeStream = storeStreams[id];
        return db.insert(streamsTable)
          .values({
            id: parseInt(id),
            scheduleId: scheduleId,
            title: storeStream.title,
            subtitle: storeStream.subtitle ?? '',
            description: storeStream.description ?? '',
            visible: storeStream.visible,
            createdBy: storeStream.createdBy,
            start: DateTime.fromISO(storeStream.start).toUTC().toJSDate(),
            end: DateTime.fromISO(storeStream.end).toUTC().toJSDate()
          });
      });
  }

  /**
   * Generates stream delete operations
   */
  private generateStreamDeletes(db: any, dbStreamIds: string[], storeStreamIds: string[], scheduleId: number) {
    return dbStreamIds
      .filter(id => !storeStreamIds.includes(id)) // Only delete streams that no longer exist in store
      .map((id) => {
        return db.delete(streamsTable)
          .where(
            and(
              eq(streamsTable.id, parseInt(id)),
              eq(streamsTable.scheduleId, scheduleId)
            )
          );
      });
  }

  /**
   * Handles tag operations (inserts and deletes)
   */
  private handleTagOperations(db: any, dbTags: any[], storeTags: any, storeStreamIds: string[], scheduleId: number) {
    // Create a map of existing tags in the database for easy lookup
    const dbTagMap: { [key: string]: boolean } = {};
    for (const tag of dbTags) {
      const key = `${tag.streamId}:${tag.tag.toLowerCase()}`;
      dbTagMap[key] = true; // Mark as existing in database and not yet processed
    }

    // Create a map of tags in the store organized by streamId
    const storeTagsByStream: { [streamId: string]: { tag: string, label: string }[] } = {};
    for (const tagId in storeTags) {
      const tagEntry = storeTags[tagId];
      if (!storeTagsByStream[tagEntry.streamId]) {
        storeTagsByStream[tagEntry.streamId] = [];
      }
      storeTagsByStream[tagEntry.streamId].push({
        tag: tagEntry.tag.toLowerCase(),
        label: tagEntry.label || tagEntry.tag
      });
    }

    // Create tag inserts for new tags
    const tagInserts: BatchItem<'sqlite'>[] = [];
    for (const streamId of storeStreamIds) {
      const streamTags = storeTagsByStream[streamId] || [];
      for (const tagObj of streamTags) {
        const normalizedTag = tagObj.tag;
        const key = `${streamId}:${normalizedTag}`;

        if (!dbTagMap[key]) {
          const label = tagObj.label || normalizedTag;
          tagInserts.push(
            db.insert(streamTagsTable)
              .values({
                streamId: parseInt(streamId),
                scheduleId: scheduleId,
                tag: normalizedTag,
                label: label,
                addedAt: DateTime.now().toUTC().toJSDate()
              })
          );
        }

        dbTagMap[key] = false; // Mark as processed
      }
    }

    // Create tag deletes for removed tags
    const tagDeletes: BatchItem<'sqlite'>[] = [];
    for (const tag of dbTags) {
      const key = `${tag.streamId}:${tag.tag.toLowerCase()}`;
      if (dbTagMap[key] === true || !storeStreamIds.includes(tag.streamId.toString())) {
        tagDeletes.push(
          db.delete(streamTagsTable)
            .where(
              and(
                eq(streamTagsTable.streamId, tag.streamId),
                eq(streamTagsTable.scheduleId, scheduleId),
                eq(streamTagsTable.tag, tag.tag)
              )
            )
        );
      }
    }

    return { tagInserts, tagDeletes };
  }

  /**
   * Handles participant operations (inserts and deletes)
   */
  private handleParticipantOperations(db: any, dbParticipants: any[], storeParticipants: any, storeStreamIds: string[], scheduleId: number) {
    // Create a map of existing participants in the database for easy lookup
    const dbParticipantMap: { [key: string]: boolean } = {};
    for (const participant of dbParticipants) {
      const key = `${participant.streamId}:${participant.userId}`;
      dbParticipantMap[key] = true; // Mark as existing in database and not yet processed
    }

    // Create a map of participants in the store organized by streamId
    const storeParticipantsByStream: { [streamId: string]: { userId: number }[] } = {};
    for (const participantId in storeParticipants) {
      const participantEntry = storeParticipants[participantId];
      if (!storeParticipantsByStream[participantEntry.streamId]) {
        storeParticipantsByStream[participantEntry.streamId] = [];
      }
      storeParticipantsByStream[participantEntry.streamId].push({
        userId: participantEntry.userId
      });
    }

    // Create participant inserts for new participants
    const participantInserts: BatchItem<'sqlite'>[] = [];
    for (const streamId of storeStreamIds) {
      const streamParticipants = storeParticipantsByStream[streamId] || [];
      for (const participantObj of streamParticipants) {
        const key = `${streamId}:${participantObj.userId}`;

        if (!dbParticipantMap[key]) {
          participantInserts.push(
            db.insert(streamParticipantsTable)
              .values({
                streamId: parseInt(streamId),
                scheduleId: scheduleId,
                userId: participantObj.userId
              })
          );
        }

        dbParticipantMap[key] = false; // Mark as processed
      }
    }

    // Create participant deletes for removed participants
    const participantDeletes: BatchItem<'sqlite'>[] = [];
    for (const participant of dbParticipants) {
      const key = `${participant.streamId}:${participant.userId}`;
      if (dbParticipantMap[key] === true || !storeStreamIds.includes(participant.streamId.toString())) {
        participantDeletes.push(
          db.delete(streamParticipantsTable)
            .where(
              and(
                eq(streamParticipantsTable.streamId, participant.streamId),
                eq(streamParticipantsTable.scheduleId, scheduleId),
                eq(streamParticipantsTable.userId, participant.userId)
              )
            )
        );
      }
    }

    return { participantInserts, participantDeletes };
  }

  /**
   * Executes the batch operations
   */
  private async executeBatchOperations(db: any, batch: BatchItem<'sqlite'>[]) {
    if (batch.length > 0) {
      // Drizzle requires a non-empty tuple for batch operations
      const [firstBatchItem, ...restBatchItems] = batch;
      // Execute all database operations in a single batch for better performance
      await db.batch([firstBatchItem, ...restBatchItems] as const);
    }
  }

  /*
  fetch(request: Request): Response | Promise<Response> {
    return super.defaultFetch(request);
  }*/

  /*
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      // Extract user ID from the request
      /*
      const url = new URL(request.url);
      const authUserId = url.searchParams.get('userId');

      if (!authUserId) {
        return new Response('Unauthorized: Missing user ID', { status: 401 });
      }

      // Verify that the user ID matches the owner of this schedule
      if (this.ownerId !== parseInt(authUserId)) {
        return new Response('Forbidden: Only the schedule owner can access this resource', { status: 403 });
      }


      // If authentication passes, proceed with the WebSocket connection
      const superFetch = super.fetch;
      if (superFetch) {
        return superFetch.call(this, request);
      } else {
        // Fallback if super.fetch is undefined
        return new Response('WebSocket connection failed: Internal server error', { status: 500 });
      }
    }

    // For non-WebSocket requests
    return new Response('This endpoint only supports WebSocket connections', { status: 400 });
  }

       */
}

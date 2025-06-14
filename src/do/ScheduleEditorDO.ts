import {type Id, type IdAddedOrRemoved, type TablesSchema, type ValuesSchema} from 'tinybase';
import {drizzle} from "drizzle-orm/d1";
import {DateTime} from "luxon";
import {TinybaseDO} from "./TinybaseDO.ts";
import type {MergeableStore} from "tinybase/mergeable-store";
import {ScheduleRepo} from "../lib/db/repos/ScheduleRepo.ts";
import {StreamRepo} from "../lib/db/repos/StreamRepo.ts";
import {StreamTagRepo} from "../lib/db/repos/StreamTagRepo.ts";
import {StreamParticipantsRepo} from "../lib/db/repos/StreamParticipantsRepo.ts";
import {schedulesTable, streamParticipantsTable, streamTagsTable, streamsTable} from "../lib/db/schema/schema";
import {type InferSelectModel} from "drizzle-orm";

/**
 * Define types for the data structures used in the ScheduleEditorDO
 */

/**
 * Represents a schedule from the database
 * Type derived from the schedulesTable schema
 */
type Schedule = InferSelectModel<typeof schedulesTable>;

/**
 * Represents a stream from the database
 * Type derived from the streamsTable schema
 */
type Stream = InferSelectModel<typeof streamsTable>;

/**
 * Represents a stream tag from the database
 * Type derived from the streamTagsTable schema
 */
type StreamTag = InferSelectModel<typeof streamTagsTable>;

/**
 * Represents a stream participant from the database
 * Type derived from the streamParticipantsTable schema
 */
type StreamParticipant = InferSelectModel<typeof streamParticipantsTable>;

/**
 * Represents a stream with its associated tags and participants
 * Used for comprehensive stream data representation
 */
type StreamWithDetails = Stream & {
  tags: StreamTag[];
  participants: StreamParticipant[];
};

/**
 * Define types for the TinyBase store tables
 */

/**
 * Interface representing the streams table in the TinyBase store
 * Maps stream IDs to their properties
 */
interface StreamsTable {
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
interface TagsTable {
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
interface ParticipantsTable {
  [id: string]: {
    /** ID of the stream this participant belongs to */
    streamId: string;
    /** User ID of the participant */
    userId: number;
    /** Display name of the participant */
    providerName: string;
    /** Service provider (e.g., Twitch, YouTube) */
    provider: string;
  };
}

/**
 * Durable Object for managing schedule editing with real-time collaboration
 * Extends TinybaseDO to leverage TinyBase for state management and WebSocket communication
 */
export class ScheduleEditorDO extends TinybaseDO {
  /** Repository for schedule database operations */
  private scheduleRepo: ScheduleRepo
  /** Repository for stream database operations */
  private streamRepo: StreamRepo
  /** Repository for stream tag database operations */
  private tagRepo: StreamTagRepo
  /** Repository for stream participant database operations */
  private participantRepo: StreamParticipantsRepo

  /**
   * Returns the namespace identifier for this Durable Object
   * @returns The string identifier for this DO type
   */
  protected namespace(): string {
    return 'ScheduleEditorDO'
  }

  /**
   * Initializes the ScheduleEditorDO with repositories and loads data
   * @param ctx - The Durable Object state context
   * @param env - The environment bindings
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    const db = drizzle(env.DB)
    this.scheduleRepo = new ScheduleRepo(db, 'do')
    this.streamRepo = new StreamRepo(db, 'do')
    this.tagRepo = new StreamTagRepo(db, 'do')
    this.participantRepo = new StreamParticipantsRepo(db, 'do')
    this.ctx.blockConcurrencyWhile(async () => {
      await this.init()
    })
  }

  /**
   * Gets the schedule ID from the Durable Object's name
   * @returns The numeric ID of the schedule being edited
   */
  private get scheduleId(): number {
    return parseInt(this.ctx.id.name!)
  }

  /**
   * Initializes the Durable Object by loading data from the database
   */
  private async init(): Promise<void> {
    await this.loadFromDB()
  }

  /**
   * Handles path ID events from the TinyBase synchronizer
   * Called when a path is added or removed from the synchronizer
   * @param pathId - The ID of the path that was added or removed
   * @param addedOrRemoved - True if the path was added, false if removed
   */
  onPathId(pathId: Id, addedOrRemoved: IdAddedOrRemoved): void {
    console.info((addedOrRemoved ? 'Added' : 'Removed') + ` path ${pathId}`);
  }

  /**
   * Handles client ID events from the TinyBase synchronizer
   * Called when a client connects to or disconnects from a path
   * @param pathId - The ID of the path the client is connected to
   * @param clientId - The ID of the client that was added or removed
   * @param addedOrRemoved - True if the client was added, false if removed
   */
  onClientId(pathId: Id, clientId: Id, addedOrRemoved: IdAddedOrRemoved): void {
    console.info(
      (addedOrRemoved ? 'Added' : 'Removed') +
      ` client ${clientId} on path ${pathId}`,
    );
  }


  /**
   * Handles messages from clients
   * Called when a client sends a message through the WebSocket connection
   * @param fromClientId - The ID of the client that sent the message
   * @param toClientId - The ID of the client the message is intended for
   * @param message - The message content
   */
  async onMessage(fromClientId: Id, toClientId: Id, message: string): Promise<void> {
    console.info('Message received on path: ', this.getPathId());
    console.log('ScheduleEditorDO', 'onMessage', fromClientId, toClientId, message);

    super.onMessage(fromClientId, toClientId, message)

    const lst = await this.ctx.storage.list()
    console.log('lst', lst)
  }

  /**
   * Gets the tables from the TinyBase store
   * @returns The tables from the persister's store
   */
  getTables() {
    const tables = this.persister?.getStore().getTables()
    console.log('ScheduleEditorDO', 'getTables', tables)
    return tables;
  }

  /**
   * Loads the schedule and streams from the database and stores them in the persister's store
   * Retrieves schedule, streams, tags, and participants and populates the TinyBase store
   */
  async loadFromDB(): Promise<void> {
    const id = this.scheduleId

    // Load schedule using ScheduleRepo
    const schedule = await this.scheduleRepo.findById(id);
    if (!schedule) {
      return;
    }

    // Load streams with details using StreamRepo
    const streamsWithDetails = await this.streamRepo.findStreamsWithDetails(id);

    // Extract streams, tags, and participants from the result
    const streams = streamsWithDetails.map(s => ({...s}));
    const tags = streamsWithDetails.flatMap(s => s.tags);
    const participants = streamsWithDetails.flatMap(s => s.participants);

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
   * Sets schedule values in the TinyBase store
   * @param store - The MergeableStore instance to update
   * @param schedule - The schedule data to store
   */
  private setScheduleValuesInStore(store: MergeableStore, schedule: Schedule) {
    store.setValue('id', schedule.id);
    store.setValue('title', schedule.title);
    store.setValue('slug', schedule.slug);
    store.setValue('year', schedule.year);
    store.setValue('visible', schedule.visible);
  }

  /**
   * Processes streams data for the TinyBase store
   * Converts StreamWithDetails objects to the format expected by the store
   * @param streams - Array of stream objects with their details
   * @returns A StreamsTable object ready to be stored in TinyBase
   */
  private processStreamsForStore(streams: StreamWithDetails[]): StreamsTable {
    const tinyStreamsTable: StreamsTable = {};

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
   * Processes tags data for the TinyBase store
   * Converts StreamTag objects to the format expected by the store
   * @param tags - Array of stream tag objects
   * @returns A TagsTable object ready to be stored in TinyBase
   */
  private processTagsForStore(tags: StreamTag[]): TagsTable {
    const tagsTable: TagsTable = {};

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
   * Processes participants data for the TinyBase store
   * Converts StreamParticipant objects to the format expected by the store
   * @param participants - Array of stream participant objects
   * @returns A ParticipantsTable object ready to be stored in TinyBase
   */
  private processParticipantsForStore(participants: StreamParticipant[]): ParticipantsTable {
    const participantsTable: ParticipantsTable = {};

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
  async saveToDB(): Promise<void> {
    // Get the TinyBase store and verify it exists
    const store = this.store
    if (!store) {
      return // Exit if store is not available
    }

    // Get the schedule ID from the store
    const scheduleId = store.getValue('id') as number

    // Update schedule information
    const scheduleData = {
      title: store.getValue('title') as string,
      slug: store.getValue('slug') as string,
      year: store.getValue('year') as number,
      visible: store.getValue('visible') as boolean,
      updatedAt: DateTime.now().toUTC().toJSDate()
    };

    await this.scheduleRepo.update(scheduleId, scheduleData);

    // Get data from the store
    const { storeStreams, storeTags, storeParticipants } = this.getDataFromStore(store);

    // Fetch existing streams with details from the database for comparison
    const streams = await this.streamRepo.findStreamsWithDetails(scheduleId);

    // Extract IDs for comparison between store and database
    const storeStreamIds = Object.keys(storeStreams).map(id => parseInt(id));
    const dbStreamIds = streams.map(stream => stream.id);

    // Prepare data for updateSchedule
    const updateData = {
      streams: {
        creates: this.prepareStreamCreates(storeStreams, storeStreamIds, dbStreamIds),
        updates: this.prepareStreamUpdates(storeStreams, storeStreamIds, dbStreamIds),
        deletes: this.prepareStreamDeletes(dbStreamIds, storeStreamIds)
      },
      participants: {
        creates: this.prepareParticipantCreates(storeParticipants, storeStreamIds),
        deletes: this.prepareParticipantDeletes(streams, storeParticipants, storeStreamIds)
      },
      tags: {
        creates: this.prepareTagCreates(storeTags, storeStreamIds),
        deletes: this.prepareTagDeletes(streams, storeTags, storeStreamIds)
      }
    };

    // Use ScheduleRepo's updateSchedule method to handle all changes in one batch
    await this.scheduleRepo.updateSchedule(scheduleId, updateData);
  }

  /**
   * Prepares stream create operations for updateSchedule
   * Identifies streams that exist in the store but not in the database and formats them for creation
   * @param storeStreams - The streams table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @param dbStreamIds - Array of stream IDs from the database
   * @returns Array of stream objects formatted for database insertion
   */
  private prepareStreamCreates(storeStreams: StreamsTable, storeStreamIds: number[], dbStreamIds: number[]): Array<{
    id: number;
    scheduleId: number;
    title: string;
    subtitle: string;
    description: string;
    visible: boolean;
    createdBy: number;
    start: Date;
    end: Date;
  }> {
    return storeStreamIds
      .filter(id => !dbStreamIds.includes(id))
      .map(id => {
        const stream = storeStreams[id.toString()];
        return {
          id,
          scheduleId: this.scheduleId,
          title: stream.title,
          subtitle: stream.subtitle ?? '',
          description: stream.description ?? '',
          visible: stream.visible,
          createdBy: stream.createdBy,
          start: DateTime.fromISO(stream.start).toUTC().toJSDate(),
          end: DateTime.fromISO(stream.end).toUTC().toJSDate()
        };
      });
  }

  /**
   * Prepares stream update operations for updateSchedule
   * Identifies streams that exist in both the store and database and formats them for updates
   * @param storeStreams - The streams table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @param dbStreamIds - Array of stream IDs from the database
   * @returns Array of stream objects formatted for database updates
   */
  private prepareStreamUpdates(storeStreams: StreamsTable, storeStreamIds: number[], dbStreamIds: number[]): Array<{
    id: number;
    title: string;
    subtitle: string;
    description: string;
    visible: boolean;
    createdBy: number;
    start: Date;
    end: Date;
  }> {
    return storeStreamIds
      .filter(id => dbStreamIds.includes(id))
      .map(id => {
        const stream = storeStreams[id.toString()];
        return {
          id,
          title: stream.title,
          subtitle: stream.subtitle ?? '',
          description: stream.description ?? '',
          visible: stream.visible,
          createdBy: stream.createdBy,
          start: DateTime.fromISO(stream.start).toUTC().toJSDate(),
          end: DateTime.fromISO(stream.end).toUTC().toJSDate()
        };
      });
  }

  /**
   * Prepares stream delete operations for updateSchedule
   * Identifies streams that exist in the database but not in the store and marks them for deletion
   * @param dbStreamIds - Array of stream IDs from the database
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of stream IDs to be deleted from the database
   */
  private prepareStreamDeletes(dbStreamIds: number[], storeStreamIds: number[]): number[] {
    return dbStreamIds.filter(id => !storeStreamIds.includes(id));
  }

  /**
   * Extracts data from the TinyBase store
   * Retrieves streams, tags, and participants tables from the store
   * @param store - The MergeableStore instance to extract data from
   * @returns Object containing the streams, tags, and participants tables
   */
  private getDataFromStore(store: MergeableStore): {
    storeStreams: StreamsTable;
    storeTags: TagsTable;
    storeParticipants: ParticipantsTable
  } {
    // Get streams from the TinyBase store
    const storeStreams = store.getTable('streams') as StreamsTable;
    this.log(storeStreams); // Log streams for debugging purposes

    // Get tags from the streamTags table in the TinyBase store
    const storeTags = store.getTable('streamTags') as TagsTable;

    // Get participants from the streamParticipants table in the TinyBase store
    const storeParticipants = (store.getTable('streamParticipants') as ParticipantsTable) || {};

    return { storeStreams, storeTags, storeParticipants };
  }

  /**
   * Prepares tag create operations for updateSchedule
   * Formats tag data from the store for database insertion
   * @param storeTags - The tags table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of tag objects formatted for database insertion
   */
  private prepareTagCreates(storeTags: TagsTable, storeStreamIds: number[]): Array<{
    streamId: number;
    tag: string;
    label: string
  }> {
    const creates: Array<{ streamId: number, tag: string, label: string }> = [];

    for (const tagId in storeTags) {
      const tag = storeTags[tagId];
      const streamId = parseInt(tag.streamId);

      // Only include tags for streams that exist in the store
      if (storeStreamIds.includes(streamId)) {
        creates.push({
          streamId,
          tag: tag.tag.toLowerCase(),
          label: tag.label || tag.tag
        });
      }
    }

    return creates;
  }

  /**
   * Prepares tag delete operations for updateSchedule
   * Identifies tags that exist in the database but not in the store and marks them for deletion
   * @param streams - Array of streams with their details from the database
   * @param storeTags - The tags table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of tag objects to be deleted from the database
   */
  private prepareTagDeletes(streams: StreamWithDetails[], storeTags: TagsTable, storeStreamIds: number[]): Array<{
    streamId: number;
    tag: string
  }> {
    const deletes: Array<{ streamId: number, tag: string }> = [];
    const storeTagMap: { [key: string]: boolean } = {};

    // Create a map of tags in the store
    for (const tagId in storeTags) {
      const tag = storeTags[tagId];
      const streamId = parseInt(tag.streamId);
      const key = `${streamId}:${tag.tag.toLowerCase()}`;
      storeTagMap[key] = true;
    }

    // For each stream in the database
    for (const stream of streams) {
      // If the stream doesn't exist in the store anymore, delete all its tags
      if (!storeStreamIds.includes(stream.id)) {
        // We don't need to add explicit deletes here as the stream deletion will cascade
        continue;
      }

      // For each tag in the database for this stream
      for (const tag of stream.tags || []) {
        const key = `${stream.id}:${tag.tag.toLowerCase()}`;

        // If the tag doesn't exist in the store anymore, delete it
        if (!storeTagMap[key]) {
          deletes.push({
            streamId: stream.id,
            tag: tag.tag.toLowerCase()
          });
        }
      }
    }

    return deletes;
  }

  /**
   * Prepares participant create operations for updateSchedule
   * Formats participant data from the store for database insertion
   * @param storeParticipants - The participants table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of participant objects formatted for database insertion
   */
  private prepareParticipantCreates(storeParticipants: ParticipantsTable, storeStreamIds: number[]): Array<{
    streamId: number;
    userId: number
  }> {
    const creates: Array<{ streamId: number, userId: number }> = [];

    for (const participantId in storeParticipants) {
      const participant = storeParticipants[participantId];
      const streamId = parseInt(participant.streamId);

      // Only include participants for streams that exist in the store
      if (storeStreamIds.includes(streamId)) {
        creates.push({
          streamId,
          userId: participant.userId
        });
      }
    }

    return creates;
  }

  /**
   * Prepares participant delete operations for updateSchedule
   * Identifies participants that exist in the database but not in the store and marks them for deletion
   * @param streams - Array of streams with their details from the database
   * @param storeParticipants - The participants table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of participant objects to be deleted from the database
   */
  private prepareParticipantDeletes(streams: StreamWithDetails[], storeParticipants: ParticipantsTable, storeStreamIds: number[]): Array<{
    streamId: number;
    userId: number
  }> {
    const deletes: Array<{ streamId: number, userId: number }> = [];
    const storeParticipantMap: { [key: string]: boolean } = {};

    // Create a map of participants in the store
    for (const participantId in storeParticipants) {
      const participant = storeParticipants[participantId];
      const streamId = parseInt(participant.streamId);
      const key = `${streamId}:${participant.userId}`;
      storeParticipantMap[key] = true;
    }

    // For each stream in the database
    for (const stream of streams) {
      // If the stream doesn't exist in the store anymore, delete all its participants
      if (!storeStreamIds.includes(stream.id)) {
        // We don't need to add explicit deletes here as the stream deletion will cascade
        continue;
      }

      // For each participant in the database for this stream
      for (const participant of stream.participants || []) {
        const key = `${stream.id}:${participant.userId}`;

        // If the participant doesn't exist in the store anymore, delete it
        if (!storeParticipantMap[key]) {
          deletes.push({
            streamId: stream.id,
            userId: participant.userId
          });
        }
      }
    }

    return deletes;
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

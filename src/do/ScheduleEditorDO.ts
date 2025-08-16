import {type Id, type IdAddedOrRemoved} from 'tinybase';
import {DateTime} from "luxon";
import {TinybaseDO} from "./TinybaseDO";
import type {MergeableStore} from "tinybase/mergeable-store";
import {RpcScheduleEditorDO} from "./RpcScheduleEditorDO";
import {schedulesTable, streamParticipantsTable, streamsTable} from "../lib/db/schema/schema";
import type {NewTag, Tag} from "../lib/db/schema/tags-schema";
import {streamTags, tagAliases, tags} from "../lib/db/schema/tags-schema";
import {and, eq, or} from "drizzle-orm";
import type {BatchItem} from "drizzle-orm/batch";
import type {
  DBSchedule,
  DBStream,
  DBStreamParticipant,
  ParticipantsTable,
  StreamsTable,
  TagsTable
} from "../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes";
import {getDB, type JJDrizzleDatabase} from "../lib/db/db";

// ==========================================
// Tag Operation Types
// ==========================================

/**
 * Result of tag lookup operations
 */
interface TagLookupResult {
  /** The found tag or null if not found */
  tag: Tag | null;
  /** Whether the tag was found by alias */
  foundByAlias: boolean;
}

/**
 * Parameters for creating a new tag
 */
interface CreateTagParams {
  /** Display name of the tag */
  name: string;
  /** URL-friendly slug (optional, generated from name if not provided) */
  slug?: string;
  /** Optional description explaining the tag's purpose */
  description?: string;
  /** Optional category ID */
  categoryId?: number;
  /** Optional color (defaults to #3584BF) */
  color?: string;
  /** ID of the user creating the tag */
  createdBy: number;
}

/**
 * Parameters for tag assignment operations
 */
interface TagAssignmentParams {
  /** ID of the stream */
  streamId: number;
  /** ID of the schedule */
  scheduleId: number;
  /** ID of the tag */
  tagId: number;
}

/**
 * Parameters for tag processing operations
 */
interface TagProcessingParams {
  /** ID of the stream */
  streamId: number;
  /** ID of the schedule */
  scheduleId: number;
  /** Array of tag labels/names to process */
  tagLabels: string[];
  /** ID of the user performing the operations */
  createdBy: number;
}

/**
 * Tag operation for batch processing
 */
interface TagOperation {
  /** Type of operation */
  type: 'add' | 'remove';
  /** Stream ID */
  streamId: number;
  /** Tag identifier (name/slug for add, tagId for remove) */
  tagIdentifier: string | number;
  /** Tag label for display (used for add operations) */
  label?: string;
}

/**
 * This file uses types from ScheduleEditorTypes.ts
 */

/**
 * Durable Object for managing schedule editing with real-time collaboration
 * Extends TinybaseDO to leverage TinyBase for state management and WebSocket communication
 */
export class ScheduleEditorDO extends TinybaseDO {
  /** Direct database access for all operations */
  private db: JJDrizzleDatabase

  /**
   * Initializes the ScheduleEditorDO with direct database access
   * @param ctx - The Durable Object state context
   * @param env - The environment bindings
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.db = getDB(env)
  }

  /**
   * Sets metadata for the Durable Object and returns an RPC wrapper
   * @param doIdentifier - The string identifier for the schedule
   * @returns An RpcScheduleEditorDO instance that wraps this DO
   */
  setMetaData(doIdentifier: string) {
    return new RpcScheduleEditorDO(doIdentifier, this, this.env);
  }

  /**
   * Initializes the Durable Object by loading data from the database
   */
  async init(doIdentifier: string): Promise<void> {
    await this.loadFromDB(doIdentifier)
  }

  /**
   * Handles path ID events from the TinyBase synchronizer
   * Called when a path is added or removed from the synchronizer
   * @param pathId - The ID of the path that was added or removed
   * @param addedOrRemoved - True if the path was added, false if removed
   */
  onPathId(pathId: Id, addedOrRemoved: IdAddedOrRemoved): void {
    this.log((addedOrRemoved ? 'Added' : 'Removed') + ` path ${pathId}`);
  }

  /**
   * Handles client ID events from the TinyBase synchronizer
   * Called when a client connects to or disconnects from a path
   * @param pathId - The ID of the path the client is connected to
   * @param clientId - The ID of the client that was added or removed
   * @param addedOrRemoved - True if the client was added, false if removed
   */
  onClientId(pathId: Id, clientId: Id, addedOrRemoved: IdAddedOrRemoved): void {
    this.log(
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
    this.log('Message received on path: ', this.getPathId());
    this.log('ScheduleEditorDO', 'onMessage', fromClientId, toClientId, message);

    super.onMessage(fromClientId, toClientId, message)

    // const lst = await this.ctx.storage.list()
    // this.log('lst', lst)
  }

  /**
   * Gets the tables from the TinyBase store
   * @returns The tables from the persister's store
   */
  getTables() {
    const tables = this.persister?.getStore().getTables()
    this.log('ScheduleEditorDO', 'getTables', tables)
    return tables;
  }

  /**
   * Loads the schedule and streams from the database and stores them in the persister's store
   * Retrieves schedule, streams, tags, and participants and populates the TinyBase store
   * @param doIdentifier - The string identifier for the schedule
   */
  async loadFromDB(doIdentifier: string): Promise<void> {
    const id = this.parseScheduleId(doIdentifier)

    // Load schedule using direct database query
    const schedule = await this.db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, id))
      .get();
    if (!schedule) {
      return;
    }

    const updatedAt = DateTime.fromJSDate(schedule.updatedAt)
    this.store?.setValue('lastScheduleDBUpdate', updatedAt?.toISO() ?? '')

    if (this.hasScheduleInStore()) {
      return
    }


    // Load streams with details using direct database queries
    // First get all streams for the schedule
    const streams = await this.db.select()
      .from(streamsTable)
      .where(eq(streamsTable.scheduleId, id))
      .all();

    // Get all stream tags for this schedule with tag details
    const allStreamTags = await this.db.select({
      streamId: streamTags.streamId,
      scheduleId: streamTags.scheduleId,
      tagId: streamTags.tagId,
      tagName: tags.name,
      tagSlug: tags.slug,
      addedAt: streamTags.addedAt
    })
      .from(streamTags)
      .leftJoin(tags, eq(streamTags.tagId, tags.id))
      .where(eq(streamTags.scheduleId, id))
      .all();

    // Get all stream participants for this schedule
    const allStreamParticipants = await this.db.select()
      .from(streamParticipantsTable)
      .where(eq(streamParticipantsTable.scheduleId, id))
      .all();

    // Group tags by streamId - create proper TinyBase tag objects for the store
    const tagsByStreamId: Record<number, {streamId: number; tag: string; label: string}[]> = {};
    for (const tag of allStreamTags) {
      if (!tagsByStreamId[tag.streamId]) {
        tagsByStreamId[tag.streamId] = [];
      }
      // Create objects suitable for TinyBase store (not DBStreamTag)
      tagsByStreamId[tag.streamId].push({
        streamId: tag.streamId,
        tag: tag.tagSlug || '', // Use slug as tag identifier
        label: tag.tagName || tag.tagSlug || '' // Use name as label, fallback to slug
      });
    }

    // Group participants by streamId
    const participantsByStreamId: Record<number, DBStreamParticipant[]> = {};
    for (const participant of allStreamParticipants) {
      if (!participantsByStreamId[participant.streamId]) {
        participantsByStreamId[participant.streamId] = [];
      }
      participantsByStreamId[participant.streamId].push(participant);
    }

    // Combine streams with their tags and participants
    const streamsWithDetails = streams.map(stream => ({
      ...stream,
      tags: tagsByStreamId[stream.id] || [],
      participants: participantsByStreamId[stream.id] || []
    }));

    this.log('ScheduleEditorDO', 'loadFromDB', schedule, streamsWithDetails.length);

    // Extract streams, tags, and participants from the result
    const processedStreams = streamsWithDetails.map(s => ({...s}));
    const processedTags = streamsWithDetails.flatMap(s => s.tags);
    const processedParticipants = streamsWithDetails.flatMap(s => s.participants);

    const store = this.store;
    if (!store) {
      return;
    }

    // Set schedule values in store
    this.setScheduleValuesInStore(store, schedule);

    // Process data and set in store
    const tinyStreamsTable = this.processStreamsForStore(processedStreams);
    const tagsTable = this.processTagsForStore(processedTags);
    const participantsTable = this.processParticipantsForStore(processedParticipants);

    // Set all tables in the store
    store.setTable('streams', tinyStreamsTable);
    store.setTable('streamTags', tagsTable);
    store.setTable('streamParticipants', participantsTable);
  }

  /**
   * Writes the state from the persister store to D1
   * This method synchronizes the TinyBase store data with the Cloudflare D1 database
   * by performing updates, inserts, and deletes as needed for schedules, streams, and tags.
   * @param doIdentifier - The string identifier for the schedule
   */
  async saveToDB(doIdentifier: string): Promise<void> {
    // Get the TinyBase store and verify it exists
    const store = this.store
    if (!store) {
      return // Exit if store is not available
    }

    // Get the schedule ID from the store
    const scheduleId = store.getValue('id') as number

    const now = DateTime.now().toUTC()
    // Update schedule information
    const scheduleData = {
      title: store.getValue('title') as string,
      slug: store.getValue('slug') as string,
      year: store.getValue('year') as number,
      visible: store.getValue('visible') as boolean,
      updatedAt: now.toJSDate()
    };

    await this.db.update(schedulesTable)
      .set(scheduleData)
      .where(eq(schedulesTable.id, scheduleId));

    this.store?.setValue('lastScheduleDBSync', now?.toISO() ?? '')

    // Get data from the store
    const {storeStreams, storeTags, storeParticipants} = this.getDataFromStore(store);

    // Fetch existing streams with details from the database for comparison
    const existingStreams = await this.db.select()
      .from(streamsTable)
      .where(eq(streamsTable.scheduleId, scheduleId))
      .all();

    // Get existing participants for comparison
    const existingStreamParticipants = await this.db.select()
      .from(streamParticipantsTable)
      .where(eq(streamParticipantsTable.scheduleId, scheduleId))
      .all();

    // Extract IDs for comparison between store and database
    const storeStreamIds = Object.keys(storeStreams).map(id => parseInt(id));
    const dbStreamIds = existingStreams.map(stream => stream.id);

    // Prepare batch operations
    const batchOperations: BatchItem<'sqlite'>[] = [];

    // Stream operations
    const streamCreates = this.prepareStreamCreates(storeStreams, storeStreamIds, dbStreamIds, scheduleId);
    const streamUpdates = this.prepareStreamUpdates(storeStreams, storeStreamIds, dbStreamIds);
    const streamDeletes = this.prepareStreamDeletes(dbStreamIds, storeStreamIds);

    // Add stream operations to batch
    for (const stream of streamCreates) {
      batchOperations.push(
        this.db.insert(streamsTable).values(stream)
      );
    }

    for (const stream of streamUpdates) {
      batchOperations.push(
        this.db.update(streamsTable)
          .set(stream)
          .where(and(eq(streamsTable.id, stream.id), eq(streamsTable.scheduleId, scheduleId)))
      );
    }

    for (const streamId of streamDeletes) {
      batchOperations.push(
        this.db.delete(streamsTable)
          .where(and(eq(streamsTable.id, streamId), eq(streamsTable.scheduleId, scheduleId)))
      );
    }

    // Participant operations
    const participantCreates = this.prepareParticipantCreates(storeParticipants, storeStreamIds);
    const participantDeletes = this.prepareParticipantDeletes(existingStreamParticipants, storeParticipants, storeStreamIds);

    // Add participant operations to batch
    for (const participant of participantCreates) {
      batchOperations.push(
        this.db.insert(streamParticipantsTable).values({
          scheduleId: scheduleId,
          streamId: participant.streamId,
          userId: participant.userId
        }).onConflictDoNothing()
      );
    }

    for (const participant of participantDeletes) {
      batchOperations.push(
        this.db.delete(streamParticipantsTable)
          .where(and(
            eq(streamParticipantsTable.scheduleId, scheduleId),
            eq(streamParticipantsTable.streamId, participant.streamId),
            eq(streamParticipantsTable.userId, participant.userId)
          ))
      );
    }

    // Process tag operations with the new schema
    await this.processStreamTagOperations(scheduleId, storeTags, storeStreamIds, batchOperations);

    // Execute all operations in a single batch
    if (batchOperations.length > 0) {
      try {
        // Ensure we have at least one operation for the batch
        const [firstOp, ...restOps] = batchOperations;
        if (firstOp) {
          await this.db.batch([firstOp, ...restOps] as const);
        }
      } catch (error) {
        this.error('saveToDB', 'Failed to execute batch operations', error);
        throw error; // Re-throw to allow calling code to handle the failure
      }
    }
  }

  /**
   * Toggle the visibility of the schedule
   * This method toggles the visibility of the schedule in both the database and the TinyBase store
   * @param doIdentifier - The string identifier for the schedule
   * @returns Promise resolving to a boolean indicating success
   */
  async toggleVisibility(doIdentifier: string): Promise<boolean> {
    // Get the TinyBase store and verify it exists
    const store = this.store;
    if (!store) {
      this.error('toggleVisibility', 'Store not initialized');
      return false;
    }

    try {
      // Get the current visibility value
      const currentVisibility = store.getValue('visible') as boolean;
      const newVisibility = !currentVisibility;

      // Get the schedule ID
      const scheduleId = this.parseScheduleId(doIdentifier);

      // Update the database
      await this.db.update(schedulesTable)
        .set({visible: newVisibility})
        .where(eq(schedulesTable.id, scheduleId));

      // Update the store
      store.setValue('visible', newVisibility);

      this.log('toggleVisibility', `Schedule visibility set to ${newVisibility}`, scheduleId);
      return true;
    } catch (e) {
      this.error('toggleVisibility error:', e);
      return false;
    }
  }

  fetch(request: Request): Response | Promise<Response> {
    return super.defaultFetch(request);
  }

  /**
   * Returns the namespace identifier for this Durable Object
   * @returns The string identifier for this DO type
   */
  protected namespace(): string {
    return 'ScheduleEditorDO'
  }

  // ==========================================
  // Tag Operations Helper Methods
  // ==========================================

  /**
   * Finds a tag by name, slug, or alias
   * @param searchTerm - The term to search for (name, slug, or alias)
   * @returns Promise resolving to the found tag or null
   */
  private async findTagByNameSlugOrAlias(searchTerm: string): Promise<Tag | null> {
    try {
      const normalizedTerm = searchTerm.toLowerCase().trim();

      // First try to find by name or slug
      let tag = await this.db.select()
        .from(tags)
        .where(or(
          eq(tags.name, normalizedTerm),
          eq(tags.slug, normalizedTerm)
        ))
        .get();

      if (tag) {
        return tag;
      }

      // If not found, try to find by alias
      const aliasResult = await this.db.select({
        tag: tags,
      })
        .from(tagAliases)
        .innerJoin(tags, eq(tagAliases.tagId, tags.id))
        .where(eq(tagAliases.alias, normalizedTerm))
        .get();

      return aliasResult?.tag || null;
    } catch (error) {
      this.error('findTagByNameSlugOrAlias', `Failed to find tag: ${searchTerm}`, error);
      return null;
    }
  }

  /**
   * Creates a new tag with the given properties
   * @param name - Display name of the tag
   * @param slug - URL-friendly slug (optional, will be generated from name)
   * @param createdBy - ID of the user creating the tag
   * @param options - Optional properties (description, categoryId, color)
   * @returns Promise resolving to the created tag
   */
  private async createTag(
    name: string,
    slug: string | null,
    createdBy: number,
    options: {
      description?: string;
      categoryId?: number;
      color?: string;
    } = {}
  ): Promise<Tag> {
    try {
      const tagSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const insertValues = {
        name: name.trim(),
        slug: tagSlug,
        description: options.description ?? null,
        categoryId: options.categoryId ?? null,
        color: options.color ?? '#3584BF',
        visible: true,
        createdBy
      } satisfies NewTag;

      const [newTag] = await this.db.insert(tags)
        .values(insertValues)
        .returning();

      return newTag;
    } catch (error) {
      this.error('createTag', `Failed to create tag: ${name}`, error);
      throw error; // Re-throw to allow calling code to handle the failure
    }
  }

  /**
   * Processes tag operations for all streams in the schedule
   * Handles tag assignments and removals based on the TinyBase store state
   * @param scheduleId - ID of the schedule
   * @param storeTags - Tags table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @param batchOperations - Array to add tag operations to
   */
  private async processStreamTagOperations(
    scheduleId: number,
    storeTags: TagsTable,
    storeStreamIds: number[],
    batchOperations: BatchItem<'sqlite'>[]
  ): Promise<void> {
    // Get current tag assignments from the database
    const existingStreamTags = await this.db.select({
      streamId: streamTags.streamId,
      scheduleId: streamTags.scheduleId,
      tagId: streamTags.tagId,
      tagName: tags.name,
      tagSlug: tags.slug
    })
      .from(streamTags)
      .leftJoin(tags, eq(streamTags.tagId, tags.id))
      .where(eq(streamTags.scheduleId, scheduleId))
      .all();

    // Create maps for efficient lookups
    const existingTagMap = new Map<string, { tagId: number; tagName: string; tagSlug: string }>();
    for (const tag of existingStreamTags) {
      const key = `${tag.streamId}:${tag.tagSlug || tag.tagName}`;
      existingTagMap.set(key, {
        tagId: tag.tagId,
        tagName: tag.tagName || '',
        tagSlug: tag.tagSlug || ''
      });
    }

    const storeTagMap = new Map<string, { streamId: number; tag: string; label: string }>();
    for (const tagId in storeTags) {
      const tag = storeTags[tagId];
      const streamId = parseInt(tag.streamId);
      if (storeStreamIds.includes(streamId)) {
        const key = `${streamId}:${tag.tag}`;
        storeTagMap.set(key, {
          streamId,
          tag: tag.tag,
          label: tag.label
        });
      }
    }

    // Find tags to add (exist in store but not in database)
    const tagsToAdd: Array<{ streamId: number; tag: string; label: string }> = [];
    for (const [key, storeTag] of Array.from(storeTagMap.entries())) {
      if (!existingTagMap.has(key)) {
        tagsToAdd.push(storeTag);
      }
    }

    // Find tags to remove (exist in database but not in store)
    const tagsToRemove: Array<{ streamId: number; tagId: number }> = [];
    for (const [key, existingTag] of Array.from(existingTagMap.entries())) {
      if (!storeTagMap.has(key)) {
        const streamId = parseInt(key.split(':')[0]);
        if (storeStreamIds.includes(streamId)) {
          tagsToRemove.push({
            streamId,
            tagId: existingTag.tagId
          });
        }
      }
    }

    // Process tag additions
    const createdBy = this.store?.getValue('createdBy') as number || 1; // Default to admin user
    for (const tagToAdd of tagsToAdd) {
      try {
        // Try to find existing tag
        let tag = await this.findTagByNameSlugOrAlias(tagToAdd.tag);

        // Create tag if it doesn't exist
        if (!tag) {
          tag = await this.createTag(tagToAdd.label || tagToAdd.tag, tagToAdd.tag, createdBy);
        }

        // Add operation to assign tag to stream
        batchOperations.push(
          this.db.insert(streamTags)
            .values({
              streamId: tagToAdd.streamId,
              scheduleId,
              tagId: tag.id
            })
            .onConflictDoNothing()
        );
      } catch (error) {
        this.error('processStreamTagOperations', `Failed to process tag addition: ${tagToAdd.tag} for stream: ${tagToAdd.streamId}`, error);
        // Continue processing other tags rather than failing the entire operation
        continue;
      }
    }

    // Process tag removals
    for (const tagToRemove of tagsToRemove) {
      batchOperations.push(
        this.db.delete(streamTags)
          .where(and(
            eq(streamTags.streamId, tagToRemove.streamId),
            eq(streamTags.scheduleId, scheduleId),
            eq(streamTags.tagId, tagToRemove.tagId)
          ))
      );
    }
  }

  /**
   * Parses a schedule ID from a string
   * @param doIdentifier - The string identifier to parse
   * @returns The numeric ID of the schedule
   */
  private parseScheduleId(doIdentifier: string): number {
    return parseInt(doIdentifier);
  }

  private hasScheduleInStore() {
    return this.store?.getValue('id') !== undefined
  }

  /**
   * Sets schedule values in the TinyBase store
   * @param store - The MergeableStore instance to update
   * @param schedule - The schedule data to store
   */
  private setScheduleValuesInStore(store: MergeableStore, schedule: DBSchedule) {
    store.setValue('id', schedule.id);
    store.setValue('title', schedule.title);
    store.setValue('slug', schedule.slug);
    store.setValue('year', schedule.year);
    store.setValue('visible', schedule.visible);
  }

  /**
   * Processes streams data for the TinyBase store
   * Converts stream objects to the format expected by the store
   * @param streams - Array of stream objects with their tags and participants
   * @returns A StreamsTable object ready to be stored in TinyBase
   */
  private processStreamsForStore(streams: (DBStream & {tags: {streamId: number; tag: string; label: string}[]; participants: DBStreamParticipant[]})[]): StreamsTable {
    const tinyStreamsTable: StreamsTable = {};

    for (const stream of streams) {
      tinyStreamsTable[`${stream.id}`] = {
        createdBy: stream.createdBy,
        title: stream.title,
        subtitle: stream.subtitle ?? '',
        description: stream.description ?? '',
        visible: stream.visible,
        youtubeVodUrl: stream.youtubeVodUrl ?? '',
        twitchVodUrl: stream.twitchVodUrl ?? '',
        start: stream.start.toISOString(),
        end: stream.end.toISOString()
      };
    }

    return tinyStreamsTable;
  }

  /**
   * Processes tags data for the TinyBase store
   * Converts tag objects with streamId, tag, label properties to TagsTable format
   * @param tags - Array of tag objects with {streamId, tag, label} structure
   * @returns A TagsTable object ready to be stored in TinyBase
   */
  private processTagsForStore(tags: {streamId: number; tag: string; label: string}[]): TagsTable {
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
  private processParticipantsForStore(participants: DBStreamParticipant[]): ParticipantsTable {
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
   * Prepares stream create operations for updateSchedule
   * Identifies streams that exist in the store but not in the database and formats them for creation
   * @param storeStreams - The streams table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @param dbStreamIds - Array of stream IDs from the database
   * @param scheduleId - The ID of the schedule
   * @returns Array of stream objects formatted for database insertion
   */
  private prepareStreamCreates(storeStreams: StreamsTable, storeStreamIds: number[], dbStreamIds: number[], scheduleId: number): Array<{
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
  }> {
    return storeStreamIds
      .filter(id => !dbStreamIds.includes(id))
      .map(id => {
        const stream = storeStreams[id.toString()];
        return {
          id,
          scheduleId,
          title: stream.title,
          subtitle: stream.subtitle ?? '',
          description: stream.description ?? '',
          visible: stream.visible,
          createdBy: stream.createdBy,
          youtubeVodUrl: stream.youtubeVodUrl ?? '',
          twitchVodUrl: stream.twitchVodUrl ?? '',
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
    youtubeVodUrl: string;
    twitchVodUrl: string;
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
          youtubeVodUrl: stream.youtubeVodUrl ?? '',
          twitchVodUrl: stream.twitchVodUrl ?? '',
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

    return {storeStreams, storeTags, storeParticipants};
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
   * @param existingParticipants - Array of existing stream participants from the database
   * @param storeParticipants - The participants table from the TinyBase store
   * @param storeStreamIds - Array of stream IDs from the store
   * @returns Array of participant objects to be deleted from the database
   */
  private prepareParticipantDeletes(existingParticipants: DBStreamParticipant[], storeParticipants: ParticipantsTable, storeStreamIds: number[]): Array<{
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

    // For each existing participant in the database
    for (const participant of existingParticipants) {
      // If the stream doesn't exist in the store anymore, delete all its participants
      if (!storeStreamIds.includes(participant.streamId)) {
        // We don't need to add explicit deletes here as the stream deletion will cascade
        continue;
      }

      const key = `${participant.streamId}:${participant.userId}`;

      // If the participant doesn't exist in the store anymore, delete it
      if (!storeParticipantMap[key]) {
        deletes.push({
          streamId: participant.streamId,
          userId: participant.userId
        });
      }
    }

    return deletes;
  }

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

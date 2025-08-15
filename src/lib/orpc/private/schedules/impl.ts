import {privateSchedulesContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {schedulesTable, streamTagsTable} from '../../../db/schema/jj-schema.ts';
import {accounts, users} from '../../../db/schema/auth-schema.ts';
import {and, desc, eq, like, notInArray, sql} from 'drizzle-orm';
import {DateTime} from 'luxon';
import {createSlug, generateScheduleSlugAlternatives} from '../../../../functions/slug.ts';
import {getTags} from '../../../../functions/getTags.ts';

const os = implement(privateSchedulesContract)
  .use(dbMiddleware);

/**
 * Schedule CRUD Operations
 */

/**
 * Create a new schedule for the authenticated user
 * Creates a schedule for the current year with auto-generated title/slug
 */
const create = os.create
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db;
    const user = context.user;
    const currentYear = DateTime.now().year;

    try {
      // Check existing schedules for title generation
      const existingSchedules = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.ownerId, user.id))
        .all();
      const allSchedulesWithCurrentYear = existingSchedules.filter(schedule => schedule.year === currentYear);
      const existingSchedule = existingSchedules.find(schedule => schedule.year === currentYear);
      const shouldBePrimary = allSchedulesWithCurrentYear.length === 0;

      // Generate title and slug
      let title = `${context.tiltifyName}'s Schedule ${currentYear}`;
      if (existingSchedule) {
        title += ` ${existingSchedules.length}`;
      }
      const slug = createSlug(title);

      // Create schedule using direct database query
      const [schedule] = await db.insert(schedulesTable)
        .values({
          ownerId: user.id,
          title: title,
          year: currentYear,
          slug: slug,
          visible: false,
          primary: shouldBePrimary
        })
        .returning();

      /*
      // Initialize the ScheduleEditorDO for this schedule
      await useRpcScheduleEditorDO(ctx, schedule.id, async (rpc) => {
        await rpc.loadFromDB();
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });

      // Add the schedule to the UserDO
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.addSchedule(schedule);
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
      */

      return {schedule};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error creating schedule:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to create schedule'});
    }
  });

/**
 * Save schedule data to database via ScheduleEditorDO
 */
const save = os.save
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const user = context.user;
    const scheduleId = input;

    try {
      // Verify ownership
      const schedule = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'});
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {message: 'You do not have permission to edit this schedule'});
      }

      /*
      // Save via ScheduleEditorDO
      await useRpcScheduleEditorDO(ctx, scheduleId, async (rpc) => {
        await rpc.saveToDB();
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
       */

      return {message: "Schedule saved successfully"};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error saving schedule:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to save schedule'});
    }
  });

/**
 * Delete a schedule owned by the authenticated user
 */
const deleteSchedule = os.delete
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const user = context.user;
    const scheduleId = input;

    try {
      // Verify ownership
      const schedule = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'});
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {message: 'You do not have permission to edit this schedule'});
      }

      // Delete from database
      await db.delete(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId));

      /*
      // Remove from UserDO
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.deleteSchedule(schedule.id);
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
       */

      return {message: "Schedule successfully deleted"};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error deleting schedule:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to delete schedule'});
    }
  });

/**
 * Schedule Management Operations
 */

/**
 * Toggle the visibility of a schedule
 */
const toggleVisibility = os.toggleVisibility
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const user = context.user;
    const {scheduleId} = input;

    try {
      // Verify ownership
      const schedule = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'});
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {message: 'You do not have permission to modify this schedule'});
      }

      /*
      // Toggle visibility via UserDO
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.toggleScheduleVisibility(scheduleId);
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
       */

      return {message: "Schedule visibility toggled successfully"};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error toggling schedule visibility:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to toggle schedule visibility'});
    }
  });

/**
 * Set a schedule as primary
 */
const setPrimary = os.setPrimary
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db;
    const user = context.user;
    const {scheduleId} = input;

    try {
      // Verify ownership
      const schedule = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', {message: 'Schedule not found'});
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {message: 'You do not have permission to modify this schedule'});
      }

      // Set as primary via UserDO
      /*
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.setPrimarySchedule(scheduleId);
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
       */

      return {message: "Schedule set as primary successfully"};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error setting schedule as primary:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to set schedule as primary'});
    }
  });

/**
 * Schedule Validation Operations
 */

/**
 * Validate slug availability and provide suggestions
 */
const validateSlug = os.validateSlug
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const ctx = context.ctx; // Astro context
    const {id, slug, title} = input;

    try {
      // Get alternatives using the generateScheduleSlugAlternatives function
      const alternatives = await generateScheduleSlugAlternatives(ctx, slug, 3, id);

      // If alternatives is empty, the slug is valid
      if (alternatives.length === 0) {
        return {
          isValid: true,
          suggestions: []
        };
      }

      // Add title as a suggestion if provided and different from slug
      let allAlternatives = [...alternatives];

      if (title && title.toLowerCase() !== slug.toLowerCase()) {
        const titleSlug = createSlug(title);
        // Check if this slug is valid
        const titleAlternatives = await generateScheduleSlugAlternatives(ctx, titleSlug, 0, id);
        if (titleAlternatives.length === 0) {
          allAlternatives.push(titleSlug);
        }
      }

      return {
        isValid: false,
        suggestions: allAlternatives
      };
    } catch (error) {
      console.error('Error validating schedule slug:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to validate slug'});
    }
  });

/**
 * Schedule Tag Operations
 */

/**
 * Get popular tags across all schedules
 */
const getPopularTags = os.getPopularTags
  .handler(async ({context, input}) => {
    const db = context.db;
    const limit = input;

    try {
      // Get popular tags from database
      const popularTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(*)`.as('count')
        })
        .from(streamTagsTable)
        .groupBy(streamTagsTable.tag, streamTagsTable.label)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
        .all();

      // If there are not enough tags found, supplement with default tags
      if (popularTags.length < limit) {
        const {tags: defaultTags, charityTags} = getTags();

        // Convert default tags to the same format as database tags
        const formattedDefaultTags = defaultTags.map(tag => ({
          ...tag,
          count: 0
        }));

        // Convert charity tags to the same format as database tags
        const formattedCharityTags = charityTags.map(tag => ({
          ...tag,
          count: 0
        }));

        // Filter out default tags that are already in the popular tags
        const existingTags = popularTags.map(t => t.tag);
        const filteredDefaultTags = formattedDefaultTags.filter(tag => !existingTags.includes(tag.tag));

        // Add enough default tags to reach the limit
        const additionalTags = filteredDefaultTags.slice(0, limit - popularTags.length);

        return {
          tags: popularTags,
          defaultTags: additionalTags,
          charityTags: formattedCharityTags
        };
      }

      // If we have enough popular tags, just return them
      return {
        tags: popularTags,
        defaultTags: [],
        charityTags: []
      };
    } catch (error) {
      console.error('Error getting popular tags:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get popular tags'});
    }
  });

/**
 * Get suggested tags for a specific stream
 */
const getSuggestedTagsForStream = os.getSuggestedTagsForStream
  .handler(async ({context, input}) => {
    const db = context.db;
    const {streamId, scheduleId, limit} = input;

    try {
      // Get all tags of the stream
      const streamTags = await db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.scheduleId, scheduleId)
        ))
        .all();
      const streamTagValues = streamTags.map(t => t.tag);

      // Find the most used tags that aren't part of the stream
      const popularTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(*)`.as('count')
        })
        .from(streamTagsTable)
        .where(streamTagValues.length > 0 ? notInArray(streamTagsTable.tag, streamTagValues) : undefined)
        .groupBy(streamTagsTable.tag, streamTagsTable.label)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
        .all();

      // Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // Return an object with charityTags and tags, excluding tags already part of the stream
      const filteredCharityTags = charityTags
        .filter(tag => !streamTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0
        }));

      const filteredDefaultTags = defaultTags
        .filter(tag => !streamTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0
        }));

      return {
        tags: popularTags,
        defaultTags: filteredDefaultTags,
        charityTags: filteredCharityTags
      };
    } catch (error) {
      console.error('Error getting suggested tags for stream:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get suggested tags for stream'});
    }
  });

/**
 * Get suggested tags for a stream matching search term
 */
const getSuggestedTagsForStreamBySearchTerm = os.getSuggestedTagsForStreamBySearchTerm
  .handler(async ({context, input}) => {
    const db = context.db;
    const {streamId, scheduleId, term, limit} = input;

    try {
      // Get all tags of the stream
      const streamTags = await db.select()
        .from(streamTagsTable)
        .where(and(
          eq(streamTagsTable.streamId, streamId),
          eq(streamTagsTable.scheduleId, scheduleId)
        ))
        .all();
      const streamTagValues = streamTags.map(t => t.tag);

      // Find the most used tags that aren't part of the stream and match the search term
      const whereConditions = [
        like(streamTagsTable.tag, `%${term}%`)
      ];

      if (streamTagValues.length > 0) {
        whereConditions.push(notInArray(streamTagsTable.tag, streamTagValues));
      }

      const databaseTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(*)`.as('count')
        })
        .from(streamTagsTable)
        .where(and(...whereConditions))
        .groupBy(streamTagsTable.tag, streamTagsTable.label)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
        .all();

      // Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();
      const searchTermLower = term.toLowerCase();

      // Filter default tags that match the search term and aren't already in the stream
      const filteredDefaultTags = defaultTags
        .filter(tag =>
          !streamTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0
        }));

      // Filter charity tags that match the search term and aren't already in the stream
      const filteredCharityTags = charityTags
        .filter(tag =>
          !streamTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0
        }));

      // If we still don't have enough tags, add more default tags that aren't in the stream
      let additionalDefaultTags: Array<{
        label: string,
        tag: string
        count: number
      }> = [];

      if (databaseTags.length + filteredDefaultTags.length + filteredCharityTags.length < limit) {
        additionalDefaultTags = defaultTags
          .filter(tag =>
            !streamTagValues.includes(tag.tag) &&
            !tag.tag.includes(searchTermLower)
          )
          .map(tag => ({
            ...tag,
            count: 0
          }))
          .slice(0, limit - (databaseTags.length + filteredDefaultTags.length + filteredCharityTags.length));
      }

      // Combine all filtered default tags
      const allFilteredDefaultTags = [...filteredDefaultTags, ...additionalDefaultTags];

      return {
        tags: databaseTags,
        defaultTags: allFilteredDefaultTags,
        charityTags: filteredCharityTags
      };
    } catch (error) {
      console.error('Error getting suggested tags by search term:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get suggested tags by search term'});
    }
  });

/**
 * Schedule Data Operations
 */

/**
 * Get tables data from ScheduleEditorDO
 * TODO: This functionality was removed as part of repository refactoring.
 * Real-time collaborative editing features may need to be reimplemented differently.
 */
const getTables = os.getTables
  .handler(async ({context, input}) => {
    const scheduleId = input;

    try {
      // This functionality was removed as part of repository refactoring
      // Return empty tables structure for now
      throw new ORPCError('NOT_IMPLEMENTED', {message: 'getTables functionality has been temporarily disabled during repository refactoring'});
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting tables:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get tables data'});
    }
  });

/**
 * Schedule Query Operations
 */

/**
 * Get all schedules by Tiltify username
 */
const getSchedulesByTiltifyUsername = os.getSchedulesByTiltifyUsername
  .handler(async ({context, input}) => {
    const db = context.db;
    const account = await db.select().from(accounts)
      .where(and(
        eq(accounts.provider, 'tiltify'),
        eq(accounts.providerUsername, input)
      ))
      .get()
    if (!account) {
      throw new ORPCError('NOT_FOUND', {message: 'User not found'})
    }
    try {
      const schedules = await db.select({
        schedule: schedulesTable
      })
        .from(schedulesTable)
        .innerJoin(users, eq(schedulesTable.ownerId, users.id))
        .where(and(
          eq(users.id, account.userId),
          eq(schedulesTable.visible, true)
        ))
        .all();

      return schedules.map(row => row.schedule);
    } catch (error) {
      console.error('Error getting schedules by tiltify username:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get schedules by tiltify username'});
    }
  });

/**
 * Get next schedule by Tiltify username
 */
const getNextScheduleByTiltifyUsername = os.getNextScheduleByTiltifyUsername
  .handler(async ({context, input}) => {
    const db = context.db;
    const tiltifyUsername = input;

    try {
      // This is a complex query that would need the streams table and time logic
      // For now, return null as this functionality might need to be implemented differently
      const nextSchedule = null;
      return {nextSchedule};
    } catch (error) {
      console.error('Error getting next schedule by tiltify username:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to get next schedule by tiltify username'});
    }
  });

/**
 * Get all schedules for the authenticated user
 */
const getSchedules = os.getSchedules
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db;
    const userId = context.userId;

    try {
      // Get all schedules for the authenticated user
      const schedules = await db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.ownerId, userId))
        .all();

      return schedules;
    } catch (error) {
      console.error('Error getting schedules for user:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get schedules' });
    }
  });

/**
 * Private schedules router with all implemented procedures
 */
export const privateSchedulesRouter = os.router({
  // Schedule CRUD Operations
  create,
  save,
  delete: deleteSchedule,

  // Schedule Management Operations
  toggleVisibility,
  setPrimary,

  // Schedule Validation Operations
  validateSlug,

  // Schedule Tag Operations
  getPopularTags,
  getSuggestedTagsForStream,
  getSuggestedTagsForStreamBySearchTerm,

  // Schedule Data Operations
  getTables,

  // Schedule Query Operations
  getSchedulesByTiltifyUsername,
  getNextScheduleByTiltifyUsername,
  getSchedules
});

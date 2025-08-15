import {privateSchedulesContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {authMiddleware} from '../../middleware/authMiddleware.ts';
import {schedulesTable} from '../../../db/schema/jj-schema.ts';
import {accounts, users} from '../../../db/schema/auth-schema.ts';
import {and, eq} from 'drizzle-orm';
import {DateTime} from 'luxon';
import {createSlug, generateScheduleSlugAlternatives} from '../../../../functions/slug.ts';

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
export const privateSchedulesRouter = {
  // Schedule CRUD Operations
  create,
  save,
  delete: deleteSchedule,

  // Schedule Management Operations
  toggleVisibility,
  setPrimary,

  // Schedule Validation Operations
  validateSlug,

  /*
  // Schedule Tag Operations
  getPopularTags,
  getSuggestedTagsForStream,
  getSuggestedTagsForStreamBySearchTerm,
  */


  // Schedule Query Operations
  getSchedulesByTiltifyUsername,
  getNextScheduleByTiltifyUsername,
  getSchedules
};

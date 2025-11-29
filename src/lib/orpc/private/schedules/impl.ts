import { privateSchedulesContract } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { schedulesTable, streamsTable } from '../../../db/schema/jj-schema.ts'
import { editSchedulesTable } from '../../../db/schema/edit-schedules-schema.ts'
import { accounts, users } from '../../../db/schema/auth-schema.ts'
import { and, eq, not } from 'drizzle-orm'
import { DateTime } from 'luxon'
import {
  createSlug,
  generateScheduleSlugAlternativesLocals,
} from '../../../../functions/slug.ts'
import { checkCanCreateSchedule } from '../util/limits.ts'

const os = implement(privateSchedulesContract).use(dbMiddleware)

/**
 * Schedule CRUD Operations
 */

/**
 * Create a new schedule for the authenticated user
 * Creates a schedule for the current year with auto-generated title/slug
 */
const create = os.create.use(authMiddleware).handler(async ({ context }) => {
  const db = context.db
  const user = context.user
  const currentYear = DateTime.now().year

  try {
    // Enforce per-year schedule limit
    const createLimit = await checkCanCreateSchedule(db, user.id, currentYear)
    if (!createLimit.canCreate) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Yearly schedule limit reached',
        ...createLimit,
      })
    }

    // Check existing schedules for title generation
    const existingSchedules = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.ownerId, user.id))
      .all()
    const allSchedulesWithCurrentYear = existingSchedules.filter(
      (schedule) => schedule.year === currentYear,
    )
    const existingSchedule = existingSchedules.find(
      (schedule) => schedule.year === currentYear,
    )
    const shouldBePrimary = allSchedulesWithCurrentYear.length === 0

    // Generate title and slug
    let title = `${context.tiltifyName}'s Schedule ${currentYear}`
    if (existingSchedule) {
      title += ` ${existingSchedules.length}`
    }
    const slug = createSlug(title)

    // Create schedule using direct database query
    const [schedule] = await db
      .insert(schedulesTable)
      .values({
        ownerId: user.id,
        title: title,
        year: currentYear,
        slug: slug,
        visible: false,
        primary: shouldBePrimary,
      })
      .returning()
    console.log('schedule', schedule)
    // Seed edit_schedules with initial draft meta
    await db
      .insert(editSchedulesTable)
      .values({
        scheduleId: schedule.id,
        editorId: user.id,
        title: schedule.title,
        slug: schedule.slug,
        year: schedule.year,
        visible: schedule.visible,
      })
      .onConflictDoNothing()
      .run()

    return { schedule }
  } catch (error) {
    if (error instanceof ORPCError) throw error
    console.error('Error creating schedule:', error)
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to create schedule',
    })
  }
})

/**
 * Create a new schedule with custom details
 */
const createWithDetails = os.createWithDetails
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const { name, slug, primary, year } = input

    try {
      // Check if slug already exists for this user
      const existingSchedule = await db
        .select()
        .from(schedulesTable)
        .where(
          and(
            eq(schedulesTable.ownerId, user.id),
            eq(schedulesTable.slug, slug),
          ),
        )
        .get()

      if (existingSchedule) {
        throw new ORPCError('CONFLICT', {
          message: 'A schedule with this slug already exists',
        })
      }

      // If setting as primary, check if there's already a primary schedule for this year
      if (primary) {
        const existingPrimary = await db
          .select()
          .from(schedulesTable)
          .where(
            and(
              eq(schedulesTable.ownerId, user.id),
              eq(schedulesTable.year, year),
              eq(schedulesTable.primary, true),
            ),
          )
          .get()

        if (existingPrimary) {
          // Unset the existing primary schedule
          await db
            .update(schedulesTable)
            .set({ primary: false })
            .where(eq(schedulesTable.id, existingPrimary.id))
        }
      }

      // Enforce per-year schedule limit
      const createLimit = await checkCanCreateSchedule(db, user.id, year)
      if (!createLimit.canCreate) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Yearly schedule limit reached',
          ...createLimit,
        })
      }

      // Create schedule using provided parameters
      const [schedule] = await db
        .insert(schedulesTable)
        .values({
          ownerId: user.id,
          title: name,
          year: year,
          slug: slug,
          visible: false, // Default to private
          primary: primary,
        })
        .returning()

      // Seed edit_schedules with initial draft meta
      await db
        .insert(editSchedulesTable)
        .values({
          scheduleId: schedule.id,
          editorId: user.id,
          title: schedule.title,
          slug: schedule.slug,
          year: schedule.year,
          visible: schedule.visible,
        })
        .onConflictDoNothing()
        .run()

      return { schedule }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error creating schedule with details:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to create schedule',
      })
    }
  })

/**
 * Save schedule data to database via ScheduleEditorDO
 */
const save = os.save.use(authMiddleware).handler(async ({ context, input }) => {
  const db = context.db
  const user = context.user
  const scheduleId = input

  try {
    // Verify ownership
    const schedule = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, scheduleId))
      .get()

    if (!schedule) {
      throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
    }

    const admin = await db
      .select({
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .get()

    if (schedule.ownerId !== user.id || admin?.role !== 'admin') {
      throw new ORPCError('FORBIDDEN', {
        message: 'You do not have permission to edit this schedule',
      })
    }

    const DO = context.env.ScheduleEditingObject

    const stubID = DO.idFromName(`${scheduleId}`)

    const stub = DO.get(stubID)

    return { message: 'Schedule saved successfully' }
  } catch (error) {
    if (error instanceof ORPCError) throw error
    console.error('Error saving schedule:', error)
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to save schedule',
    })
  }
})

/**
 * Delete a schedule owned by the authenticated user
 */
const deleteSchedule = os.delete
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const scheduleId = input

    try {
      // Verify ownership
      const schedule = await db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
      }

      const admin = await db
        .select({
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .get()
      console.log('role', admin)

      if (schedule.ownerId !== user.id || admin?.role !== 'admin') {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to edit this schedule',
        })
      }

      // Delete from database
      await db.delete(schedulesTable).where(eq(schedulesTable.id, scheduleId))

      /*
      // Remove from UserDO
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.deleteSchedule(schedule.id);
      }, (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      });
       */

      return { message: 'Schedule successfully deleted' }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error deleting schedule:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to delete schedule',
      })
    }
  })

/**
 * Schedule Management Operations
 */

/**
 * Toggle the visibility of a schedule
 */
const toggleVisibility = os.toggleVisibility
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const { scheduleId } = input

    try {
      // Verify ownership
      const schedule = await db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to modify this schedule',
        })
      }

      await db
        .update(schedulesTable)
        .set({
          visible: !schedule.visible,
        })
        .where(eq(schedulesTable.id, scheduleId))

      await db
        .update(editSchedulesTable)
        .set({
          visible: !schedule.visible,
        })
        .where(eq(editSchedulesTable.scheduleId, scheduleId))

      return { message: 'Schedule visibility toggled successfully' }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error toggling schedule visibility:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to toggle schedule visibility',
      })
    }
  })

/**
 * Set a schedule as primary
 */
const setPrimary = os.setPrimary
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const { scheduleId } = input

    try {
      // Verify ownership
      const schedule = await db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to modify this schedule',
        })
      }

      await db
        .update(schedulesTable)
        .set({
          primary: true,
        })
        .where(eq(schedulesTable.id, scheduleId))

      await db
        .update(schedulesTable)
        .set({
          primary: false,
        })
        .where(
          and(
            eq(schedulesTable.ownerId, user.id),
            eq(schedulesTable.year, schedule.year),
            not(eq(schedulesTable.id, scheduleId)),
          ),
        )

      return { message: 'Schedule set as primary successfully' }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error setting schedule as primary:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to set schedule as primary',
      })
    }
  })

const removePrimary = os.removePrimary
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const { scheduleId } = input
    try {
      // Verify ownership
      const schedule = await db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()

      if (!schedule) {
        throw new ORPCError('NOT_FOUND', { message: 'Schedule not found' })
      }

      if (schedule.ownerId !== user.id) {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to modify this schedule',
        })
      }

      await db
        .update(schedulesTable)
        .set({
          primary: false,
        })
        .where(eq(schedulesTable.id, scheduleId))

      return { message: 'Schedule set not as primary successfully' }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      console.error('Error setting schedule as primary:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to set schedule as primary',
      })
    }
  })

/**
 * Schedule Validation Operations
 */

/**
 * Validate slug availability and provide suggestions
 */
const validateSlug = os.validateSlug
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const { slug, tiltifyName } = input
    const user = context.user

    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Slug is required' })
    }

    try {
      // Get alternatives using the generateScheduleSlugAlternatives function
      // If it returns alternatives, the slug is not valid
      const alternatives = await generateScheduleSlugAlternativesLocals(
        context.locals,
        slug,
        3,
      )

      // If alternatives is empty, the slug is valid
      if (alternatives.length === 0) {
        return {
          isValid: true,
          suggestions: [],
        }
      }

      // Add tiltifyName as a suggestion if provided and different from slug
      let allAlternatives = [...alternatives]

      if (tiltifyName && tiltifyName.toLowerCase() !== slug.toLowerCase()) {
        const tiltifySlug = createSlug(tiltifyName)
        // Check if this slug is valid using generateScheduleSlugAlternatives
        // If it returns an empty array, the slug is valid
        const tiltifyAlternatives =
          await generateScheduleSlugAlternativesLocals(
            context.locals,
            tiltifySlug,
            0,
          )
        if (tiltifyAlternatives.length === 0) {
          allAlternatives.push(tiltifySlug)
        }
      } else if (
        user.tiltifyName &&
        user.tiltifyName.toLowerCase() !== slug.toLowerCase()
      ) {
        const userTiltifySlug = createSlug(user.tiltifyName)
        // Check if this slug is valid using generateScheduleSlugAlternatives
        // If it returns an empty array, the slug is valid
        const userTiltifyAlternatives =
          await generateScheduleSlugAlternativesLocals(
            context.locals,
            userTiltifySlug,
            0,
          )
        if (userTiltifyAlternatives.length === 0) {
          allAlternatives.push(userTiltifySlug)
        }
      }

      return {
        isValid: false,
        suggestions: allAlternatives,
      }
    } catch (error) {
      console.error('Error validating schedule slug:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to validate slug',
      })
    }
  })

/**
 * Schedule Query Operations
 */

/**
 * Get all schedules by Tiltify username
 */
const getSchedulesByTiltifyUsername = os.getSchedulesByTiltifyUsername.handler(
  async ({ context, input }) => {
    const db = context.db
    const account = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, 'tiltify'),
          eq(accounts.providerUsername, input),
        ),
      )
      .get()
    if (!account) {
      throw new ORPCError('NOT_FOUND', { message: 'User not found' })
    }
    try {
      const schedules = await db
        .select({
          schedule: schedulesTable,
        })
        .from(schedulesTable)
        .innerJoin(users, eq(schedulesTable.ownerId, users.id))
        .where(
          and(eq(users.id, account.userId), eq(schedulesTable.visible, true)),
        )
        .all()

      return schedules.map((row) => row.schedule)
    } catch (error) {
      console.error('Error getting schedules by tiltify username:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get schedules by tiltify username',
      })
    }
  },
)

/**
 * Get next schedule by Tiltify username
 */
const getNextScheduleByTiltifyUsername =
  os.getNextScheduleByTiltifyUsername.handler(async ({ context, input }) => {
    const db = context.db
    const tiltifyUsername = input

    try {
      // This is a complex query that would need the streams table and time logic
      // For now, return null as this functionality might need to be implemented differently
      const nextSchedule = null
      return { nextSchedule }
    } catch (error) {
      console.error('Error getting next schedule by tiltify username:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get next schedule by tiltify username',
      })
    }
  })

/**
 * Get all schedules for the authenticated user
 */
const getSchedules = os.getSchedules
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db
    const userId = context.userId

    try {
      // Get all schedules for the authenticated user
      const schedules = await db
        .select()
        .from(schedulesTable)
        .where(eq(schedulesTable.ownerId, userId))
        .all()

      return schedules
    } catch (error) {
      console.error('Error getting schedules for user:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get schedules',
      })
    }
  })

/**
 * Private schedules router with all implemented procedures
 */
// Limit-checks
const canCreateSchedule = os.canCreateSchedule
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const { db, userId } = context
    const { year } = input
    return checkCanCreateSchedule(db, userId, year)
  })

const hasInvisibleStreamsInVisibleSchedule =
  os.hasInvisibleStreamsInVisibleScheduleContract
    .use(authMiddleware)
    .handler(async ({ context }) => {
      const db = context.db
      const userId = context.userId

      const year = new Date().getFullYear()

      try {
        // Get all schedules for the authenticated user
        const schedule = await db
          .select({
            id: schedulesTable.id,
            visible: schedulesTable.visible,
          })
          .from(schedulesTable)
          .where(
            and(
              eq(schedulesTable.ownerId, userId),
              eq(schedulesTable.primary, true),
              eq(schedulesTable.year, year),
            ),
          )
          .get()

        if (!schedule) {
          return false
        }

        const streams = await db
          .select({
            visible: streamsTable.visible,
          })
          .from(streamsTable)
          .where(eq(streamsTable.scheduleId, schedule.id))
          .all()

        if (streams.length === 0) {
          return false
        }

        const allVisible = streams.every(s => s.visible)

        return !allVisible;
      } catch (error) {
        console.error('Error getting schedules for user:', error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to get schedules',
        })
      }
    })

export const privateSchedulesRouter = {
  // Schedule CRUD Operations
  create,
  createWithDetails,
  save,
  delete: deleteSchedule,

  // Schedule Management Operations
  toggleVisibility,
  setPrimary,
  removePrimary,

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
  getSchedules,

  // Limit-checks
  canCreateSchedule,

  hasInvisibleStreamsInVisibleSchedule,
}

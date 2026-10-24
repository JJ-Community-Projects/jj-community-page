import { privateSchedulesContract } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { schedulesTable, streamsTable } from '../../../db/schema/jj-schema.ts'
import { editSchedulesTable } from '../../../db/schema/edit-schedules-schema.ts'
import { accounts, users } from '../../../db/schema/auth-schema.ts'
import { and, eq, ne, not, sql } from 'drizzle-orm'
import {
  createSlug,
  slugFreeFrom,
  slugLookups,
  validateSlugFor,
} from '../../../../functions/slug.ts'
import {
  canCreateScheduleFrom,
  yearSchedulesCount,
} from '../util/limits.ts'
import { forgetPublicSchedule } from '../../../services/visibilityCache.ts'

const os = implement(privateSchedulesContract).use(dbMiddleware)

/**
 * Schedule CRUD Operations
 */

/**
 * Create a new schedule with custom details
 */
const createWithDetails = os.createWithDetails
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const user = context.user
    const { name, primary, year } = input
    // The slug as it will be stored; the dialog checks the same normalised slug (F-59)
    const slug = createSlug(input.slug)
    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid slug format' })
    }

    try {
      // One round trip: is the slug another user's username or any schedule's slug, and the
      // yearly limit
      const [blockedRows, takenRows, yearRows] = await db.batch([
        ...slugLookups(db, 'schedule', user.id, [slug]),
        yearSchedulesCount(db, user.id, year),
      ])

      if (!slugFreeFrom([blockedRows, takenRows])(slug)) {
        throw new ORPCError('CONFLICT', {
          message: 'A schedule with this slug already exists',
        })
      }

      const createLimit = canCreateScheduleFrom(yearRows, year)
      if (!createLimit.canCreate) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Yearly schedule limit reached',
          ...createLimit,
        })
      }

      // One atomic batch (EDT-14): a new primary replaces the year's old one only together with
      // the insert (it used to be unset before the limit check), and edit_schedules is seeded
      // with the draft meta.
      const [[schedule]] = await db.batch([
        db
          .insert(schedulesTable)
          .values({
            ownerId: user.id,
            title: name,
            year: year,
            slug: slug,
            visible: false, // Default to private
            primary: primary,
          })
          .returning(),
        ...(primary
          ? [
              db
                .update(schedulesTable)
                .set({ primary: false })
                .where(
                  and(
                    eq(schedulesTable.ownerId, user.id),
                    eq(schedulesTable.year, year),
                    eq(schedulesTable.primary, true),
                    ne(schedulesTable.slug, slug),
                  ),
                ),
            ]
          : []),
        db
          .insert(editSchedulesTable)
          .select(
            db
              .select({
                scheduleId: schedulesTable.id,
                editorId: sql<number>`${user.id}`.as('editor_id'),
                title: schedulesTable.title,
                slug: schedulesTable.slug,
                year: schedulesTable.year,
                visible: schedulesTable.visible,
                // insert … select needs every column; these are the table defaults
                status: sql<'active'>`'active'`.as('status'),
                version: sql<number>`1`.as('version'),
                createdAt: sql<Date>`(unixepoch())`.as('created_at'),
                updatedAt: sql<Date>`(unixepoch())`.as('updated_at'),
              })
              .from(schedulesTable)
              .where(eq(schedulesTable.slug, slug)),
          )
          .onConflictDoNothing(),
      ])

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

      // The owner or an admin (EDT-15)
      if (schedule.ownerId !== user.id && admin?.role !== 'admin') {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to edit this schedule',
        })
      }

      // The owner's slug for the cache purge; an admin may delete someone else's schedule
      const ownerSlug =
        schedule.ownerId === user.id
          ? user.tiltifySlug
          : (
              await db
                .select({ slug: accounts.tiltifySlug })
                .from(accounts)
                .where(
                  and(
                    eq(accounts.userId, schedule.ownerId),
                    eq(accounts.provider, 'tiltify'),
                  ),
                )
                .get()
            )?.slug

      // Delete from database
      await db.delete(schedulesTable).where(eq(schedulesTable.id, scheduleId))

      // Drop the cached public answers that still show it
      if (ownerSlug)
        await forgetPublicSchedule(context.request.url, schedule, ownerSlug)

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

      // The owner is the caller (checked above)
      await forgetPublicSchedule(context.request.url, schedule, user.tiltifySlug)

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
 * Validate slug availability and provide suggestions (one round trip, see validateSlugFor)
 */
const validateSlug = os.validateSlug
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const { slug, tiltifyName } = input

    if (!slug) {
      throw new ORPCError('BAD_REQUEST', { message: 'Slug is required' })
    }

    try {
      return await validateSlugFor('schedule', context.user, slug, tiltifyName)
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
        .orderBy(schedulesTable.id)
        .all()

      return schedules
    } catch (error) {
      console.error('Error getting schedules for user:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get schedules',
      })
    }
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
              eq(schedulesTable.visible, true),
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

        return streams.every((s) => !s.visible)
      } catch (error) {
        console.error('Error getting schedules for user:', error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to get schedules',
        })
      }
    })

export const privateSchedulesRouter = {
  // Schedule CRUD Operations
  createWithDetails,
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
  getSchedules,

  hasInvisibleStreamsInVisibleSchedule,
}

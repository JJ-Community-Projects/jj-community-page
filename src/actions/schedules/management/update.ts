import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {ScheduleService} from "../../../lib/db/services/schedules/ScheduleService.ts";
import {ScheduleAuthorizationService} from "../../../lib/db/services/schedules/ScheduleAuthorizationService.ts";
import {useRpcScheduleEditorDO, useRpcUserDO} from "../../getDO.ts";

/**
 * Toggles the visibility of a schedule.
 * Input: An object containing:
 *   - scheduleId (number) - The ID of the schedule to toggle visibility
 * Action: Verifies the user owns the schedule and then toggles its visibility using the UserDO.
 * Returns: An object with a success message.
 */
export const toggleVisibility = defineAction({
  input: z.object({
    scheduleId: z.number(),
  }),
  handler: async ({scheduleId}, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }
    if (!scheduleId) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
    }

    // Use authorization service to check if user can edit the schedule
    const authService = ScheduleAuthorizationService.action(ctx)
    try {
      await authService.ensureCanEditSchedule(user.id, scheduleId)
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new ActionError({code: 'NOT_FOUND', message: error.message})
      }
      if (error.name === 'AuthorizationError') {
        throw new ActionError({code: 'FORBIDDEN', message: error.message})
      }
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
    }

    // Get the schedule to toggle its visibility
    const scheduleService = ScheduleService.action(ctx)
    const schedule = await scheduleService.getScheduleById(scheduleId, user.id)

    // Toggle visibility using UserDO
    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.toggleScheduleVisibility(scheduleId)
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    return {message: "Schedule visibility toggled successfully"}
  }
});

/**
 * Sets a schedule as primary and all other schedules with the same year as non-primary.
 * Input: An object containing:
 *   - scheduleId (number) - The ID of the schedule to set as primary
 * Action: Verifies the user owns the schedule and then sets it as primary using the UserDO.
 * Returns: An object with a success message.
 */
export const setPrimary = defineAction({
  input: z.object({
    scheduleId: z.number(),
  }),
  handler: async ({scheduleId}, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }
    if (!scheduleId) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
    }

    // Use authorization service to check if user can edit the schedule
    const authService = ScheduleAuthorizationService.action(ctx)
    try {
      await authService.ensureCanEditSchedule(user.id, scheduleId)
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new ActionError({code: 'NOT_FOUND', message: error.message})
      }
      if (error.name === 'AuthorizationError') {
        throw new ActionError({code: 'FORBIDDEN', message: error.message})
      }
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
    }

    // Set the schedule as primary using ScheduleService
    const scheduleService = ScheduleService.action(ctx)
    await scheduleService.setPrimarySchedule(scheduleId, user.id)

    // Update the UserDO as well
    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.setPrimarySchedule(scheduleId)
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    })

    return {message: "Schedule set as primary successfully"}
  }
});

/**
 * Saves the current state of a schedule to the database.
 * Input: scheduleId (number) - The ID of the schedule to save
 * Action: Verifies the user owns the schedule and then saves the schedule's current state from the ScheduleEditorDO to the database.
 * Returns: An object with a success message.
 */
export const save = defineAction({
  input: z.number(),
  handler: async (scheduleId, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }

    if (!scheduleId) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
    }

    // Use authorization service to check if user can edit the schedule
    const authService = ScheduleAuthorizationService.action(ctx)
    try {
      await authService.ensureCanEditSchedule(user.id, scheduleId)
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new ActionError({code: 'NOT_FOUND', message: error.message})
      }
      if (error.name === 'AuthorizationError') {
        throw new ActionError({code: 'FORBIDDEN', message: error.message})
      }
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
    }

    // Get the ScheduleEditorDO and save to DB
    await useRpcScheduleEditorDO(ctx, scheduleId, async (rpc) => {
      await rpc.saveToDB();
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    return {message: "Schedule saved successfully"}
  }
});

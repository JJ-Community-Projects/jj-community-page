import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {ScheduleService} from "../../../lib/db/services/schedules/ScheduleService.ts";
import {ScheduleAuthorizationService} from "../../../lib/db/services/schedules/ScheduleAuthorizationService.ts";
import {useRpcUserDO} from "../../getDO.ts";

/**
 * Deletes a schedule owned by the authenticated user.
 * Input: scheduleId (number) - The ID of the schedule to delete
 * Action: Verifies the user owns the schedule, deletes it from the database, and removes it from the UserDO.
 * Returns: An object with a success message.
 */
export const deleteSchedule = defineAction({
  input: z.number(),
  handler: async (scheduleId, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }
    if (!scheduleId) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
    }

    // Use authorization service to check if user can delete the schedule
    const authService = ScheduleAuthorizationService.action(ctx)
    try {
      await authService.ensureCanDeleteSchedule(user.id, scheduleId)
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new ActionError({code: 'NOT_FOUND', message: error.message})
      }
      if (error.name === 'AuthorizationError') {
        throw new ActionError({code: 'FORBIDDEN', message: error.message})
      }
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
    }

    // Get the schedule to return its ID for UserDO update
    const scheduleService = ScheduleService.action(ctx)
    const schedule = await scheduleService.getScheduleById(scheduleId, user.id)

    // Delete the schedule using service
    await scheduleService.deleteSchedule(scheduleId, user.id)

    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.deleteSchedule(schedule.id);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    return {message: "Schedule successfully deleted"}
  }
});

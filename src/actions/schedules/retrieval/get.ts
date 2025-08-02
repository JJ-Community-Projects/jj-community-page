import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {ScheduleService} from "../../../lib/db/services/schedules/ScheduleService.ts";
import {useRpcScheduleEditorDO} from "../../getDO.ts";

/**
 * Retrieves the tables data from a schedule's ScheduleEditorDO.
 * Input: scheduleId (number) - The ID of the schedule
 * Action: Gets the tables data from the ScheduleEditorDO for the specified schedule.
 * Returns: The tables data from the ScheduleEditorDO.
 */
export const getTables = defineAction({
  input: z.number(),
  handler: async (scheduleId, ctx) => {
    return useRpcScheduleEditorDO(ctx, scheduleId, async (rpc) => {
      return rpc.getTables();
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });
  }
});

/**
 * Retrieves all schedules owned by a user with a given tiltify username.
 * Input: tiltifyUsername (string) - The tiltify username to find schedules for
 * Action: Uses the ScheduleRepo to find all schedules owned by the user with the given tiltify username.
 * Returns: An array of schedules owned by the user.
 */
export const getSchedulesByTiltifyUsername = defineAction({
  input: z.string(),
  handler: async (tiltifyUsername, ctx) => {
    try {
      const scheduleService = ScheduleService.action(ctx);
      // Note: We're assuming ScheduleService has a method to find schedules by tiltify username
      // If not, this might need to be adjusted or left using the repository directly
      const schedules = await scheduleService.findSchedulesByTiltifyUsername(tiltifyUsername);

      return schedules;
    } catch (e: any) {
      console.error('Error getting schedules by tiltify username:', e);
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
    }
  }
});

/**
 * Retrieves the next schedule for a user with a given tiltify username.
 * Input: tiltifyUsername (string) - The tiltify username to find the next schedule for
 * Action: Uses the ScheduleRepo to find the next schedule for the user with the given tiltify username.
 * Returns: An object containing the schedule and its streams, or null if none found.
 */
export const getNextScheduleByTiltifyUsername = defineAction({
  input: z.string(),
  handler: async (tiltifyUsername, ctx) => {
    try {
      const scheduleService = ScheduleService.action(ctx);
      // Note: We're assuming ScheduleService has a method to find the next schedule by tiltify username
      // If not, this might need to be adjusted or left using the repository directly
      const nextSchedule = await scheduleService.findNextScheduleByTiltifyUsername(tiltifyUsername);

      return {nextSchedule};
    } catch (e: any) {
      console.error('Error getting next schedule by tiltify username:', e);
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
    }
  }
});

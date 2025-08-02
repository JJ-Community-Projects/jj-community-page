import {ActionError, defineAction} from "astro:actions";
import {DateTime} from "luxon";
import {createSlug} from "../../../functions/slug.ts";
import {useRpcScheduleEditorDO, useRpcUserDO} from "../../getDO.ts";
import {ScheduleService} from "../../../lib/db/services/schedules/ScheduleService.ts";
import {ScheduleAuthorizationService} from "../../../lib/db/services/schedules/ScheduleAuthorizationService.ts";

/**
 * Creates a new schedule for the authenticated user.
 * Input: None
 * Action: Creates a new schedule for the current year, initializes the ScheduleEditorDO,
 *         and adds the schedule to the UserDO.
 * Returns: An object containing the created schedule.
 */
export const create = defineAction({
  handler: async (_, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }

    // Check if user can create a schedule
    const authService = ScheduleAuthorizationService.action(ctx)
    try {
      await authService.ensureCanCreateSchedule(user.id)
    } catch (error: any) {
      if (error.name === 'AuthorizationError') {
        throw new ActionError({code: 'FORBIDDEN', message: error.message})
      }
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message})
    }

    const scheduleService = ScheduleService.action(ctx)
    const currentYear = DateTime.now().year

    // Check if user already has a schedule
    const existingSchedules = await scheduleService.findSchedulesByOwnerId(user.id)

    const allSchedulesWithCurrentYear = existingSchedules.filter(schedule => schedule.year === currentYear)

    const existingSchedule = existingSchedules.find(schedule => schedule.year === currentYear)

    const shouldBePrimary = allSchedulesWithCurrentYear.length === 0
    /*
    if (existingSchedule) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule for this year already exists'})
    }*/

    let title = `${user.tiltifyName}'s Schedule ${currentYear}`
    if (existingSchedule) {
      title += ` ${existingSchedules.length}`
    }
    const slug = createSlug(title)

    // Create schedule using service
    const schedule = await scheduleService.createSchedule({
      ownerId: user.id,
      title: title,
      year: currentYear,
      slug: slug,
      visible: false,
      primary: shouldBePrimary
    }, user.id)

    // Initialize the ScheduleEditorDO for this schedule
    await useRpcScheduleEditorDO(ctx, schedule.id, async (rpc) => {
      await rpc.loadFromDB();
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    // Add the schedule to the UserDO
    await useRpcUserDO(ctx, user.id, async (rpc) => {
      await rpc.addSchedule(schedule);
    }, (error) => {
      throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
    });

    return {schedule}
  }
});

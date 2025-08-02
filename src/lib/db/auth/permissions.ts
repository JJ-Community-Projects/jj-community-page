import {requiresAuthorization, requiresService, type ServiceAuthorizationCheck} from "./decorators";
import type {ScheduleService} from "../services/schedules/ScheduleService.ts";


/**
 * Requires permission to view a schedule
 */
export function requiresViewSchedulePermission(
  errorMessage: string = "You don't have permission to view this schedule"
) {
  return requiresAuthorization(
    async function (this: any, userId: number, scheduleId: number) {
      const schedule = await this.scheduleRepo.findById(scheduleId);

      if (!schedule) {
        return false;
      }

      // Public schedules can be viewed by anyone
      if (schedule.visible) {
        return true;
      }

      // Schedule owners can always view their schedules
      if (schedule.ownerId === userId) {
        return true;
      }

      // Check if user is an admin
      const user = await this.userRepo.findById(userId);
      return user && user.role === 'admin';
    },
    errorMessage
  );
}

/**
 * Requires permission to edit a schedule
 */
export function requiresEditSchedulePermission(
  errorMessage: string = "You don't have permission to edit this schedule"
) {
  return requiresAuthorization(
    async function (this: any, userId: number, scheduleId: number) {
      const schedule = await this.scheduleRepo.findById(scheduleId);

      if (!schedule) {
        return false;
      }

      // Schedule owners can always edit their schedules
      if (schedule.ownerId === userId) {
        return true;
      }

      // Check if user is an admin
      const user = await this.userRepo.findById(userId);
      return user && user.role === 'admin';
    },
    errorMessage
  );
}

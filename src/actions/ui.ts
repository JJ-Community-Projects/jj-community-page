import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {ScheduleUIRepo} from "../lib/db/repos/ScheduleUIRepo.ts";
import {fullJJExampleSchedule} from "../functions/exampleSchedule.ts";

export const ui = {
  user: {
    schedules: {
      byTiltifyName: defineAction({
        input: z.string(),
        handler: (tiltifyUsername: string, ctx) => {
          try {
            const repo = ScheduleUIRepo.action(ctx);
            return repo.findNextScheduleByTiltifyUsernameFormated(tiltifyUsername);
          } catch (e: any) {
            console.error('Error getting next schedule by tiltify username:', e);
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
          }
        }
      }),
      byScheduleSlug: defineAction({
        input: z.string(),
        handler: async (slug: string, ctx) => {
          let repo: ScheduleUIRepo;

          try {
            console.log('ui.user.schedules.byScheduleSlug', slug)
            repo = ScheduleUIRepo.action(ctx);
          } catch (e: any) {
            console.error('Error getting schedule by slug:', e);
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
          }

          console.log('ui.user.schedules.byScheduleSlug', slug)
          const schedule = await repo.getScheduleBySlug(slug);
          if (!schedule) {
            throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
          }

          if (!schedule.schedule) {
            throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
          }

          if (!schedule.schedule.visible) {
            throw new ActionError({code: 'NOT_FOUND', message: 'Schedule is set to private'});
          }

          return schedule;
        }
      }),
      demo: defineAction({
        handler: (_, context) => {
          return fullJJExampleSchedule()
        }
      }),
      getCurrentPrimaryBySlug: defineAction({
        input: z.string(),
        handler: async (slug: string, ctx) => {
          try {
            const repo = ScheduleUIRepo.action(ctx);
            const schedule = await repo.getCurrentPrimaryBySlug(slug);

            if (!schedule) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Primary schedule not found for this user.'});
            }

            if (!schedule.schedule) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
            }

            if (!schedule.schedule.visible) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Schedule is set to private'});
            }

            return schedule;
          } catch (e: any) {
            console.error('Error getting primary schedule by slug:', e);
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
          }
        }
      }),
      getCurrentPrimaryByTiltifyUsername: defineAction({
        input: z.string(),
        handler: async (tiltifyUsername: string, ctx) => {
          try {
            const repo = ScheduleUIRepo.action(ctx);
            const schedule = await repo.getCurrentPrimaryByTiltifyUsername(tiltifyUsername);

            if (!schedule) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Primary schedule not found for this user.'});
            }

            if (!schedule.schedule) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
            }

            if (!schedule.schedule.visible) {
              throw new ActionError({code: 'NOT_FOUND', message: 'Schedule is set to private'});
            }

            return schedule;
          } catch (e: any) {
            console.error('Error getting primary schedule by tiltify username:', e);
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
          }
        }
      })
    }
  }
}

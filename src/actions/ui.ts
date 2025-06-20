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
        handler: (slug: string, ctx) => {
          try {
            const repo = ScheduleUIRepo.action(ctx);
            return repo.getScheduleBySlug(slug);
          } catch (e: any) {
            console.error('Error getting schedule by slug:', e);
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
          }
        }
      }),
      demo: defineAction({
        handler: (_, context) => {
          return fullJJExampleSchedule()
        }
      })
    }
  }
}

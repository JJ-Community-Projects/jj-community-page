import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {TeamRepo} from "../lib/db/repos/teams/TeamRepo.ts";
import {UserService} from "../lib/db/services/users/UserService.ts";

export const ui = {
  users: {
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
    },

    byId: defineAction({
      input: z.number(),
      handler: async (id, context) => {
        const repo = UserUIRepo.action(context);
        const data = await repo.getUserById(id)
        if (!data) {
          throw new ActionError({
            code: 'NOT_FOUND',
          })
        }
        return data
      }
    }),
    bySlug: defineAction({
      input: z.string(),
      handler: async (slug, context) => {
        const repo = UserService.action(context);
        const data = await repo.getUserByName(slug)
        if (!data) {
          throw new ActionError({
            code: 'NOT_FOUND',
          })
        }
        return data
      }
    }),
    all: defineAction({
      handler: async (_, context) => {
        try {
          const repo = UserUIRepo.action(context);
          return await repo.getAllUsers();
        } catch (e: any) {
          console.error('Error getting all users:', e);
          throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
        }
      }
    })
  },
  teams: {
    getById: defineAction({
      input: z.number(),
      handler: async (teamId, context) => {
        const teamRepo =  TeamRepo.action(context);
        const team = await teamRepo.findById(teamId);
        if (!team) {
          return null;
        }
        const scheduleRepo = ScheduleUIRepo.action(context);
        const teamSchedule = await scheduleRepo.getTeamSchedule(teamId);
        if (!teamSchedule) {
          throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
        }
        return {
          team: team,
          ...teamSchedule,
        }
      }
    }),
    getBySlug: defineAction({
      input: z.string(),
      handler: async (slug, context) => {
        const teamRepo =  TeamRepo.action(context);
        const team = await teamRepo.findBySlug(slug);
        if (!team) {
          return null;
        }
        const scheduleRepo = ScheduleUIRepo.action(context);
        const teamSchedule = await scheduleRepo.getTeamSchedule(team.id);
        if (!teamSchedule) {
          throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found.'});
        }
        return {
          team: team,
          ...teamSchedule,
        }
      }
    })
  }
}

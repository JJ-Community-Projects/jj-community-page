import {ActionError, defineAction} from "astro:actions";
import {UserRepo} from "../lib/db/repos/users/UserRepo.ts";
import {TiltifyWebService} from "../lib/externalAPI/TiltifyWebService.ts";


export const tiltify = {
  getAllCampaigns: defineAction({
    handler: async (_, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userRepo = UserRepo.action(context);

      const userId = user.id;

      const dbUser = await userRepo.findById(userId);
      if (!dbUser) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      if (dbUser.role !== 'admin') {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const api = TiltifyWebService.action(context)

      const {data, error} = await api.getAllCampaigns()

      if (error) {
        throw new ActionError({code: 'UNAUTHORIZED', message: error.message});
      }

      return data
    }
  })
}

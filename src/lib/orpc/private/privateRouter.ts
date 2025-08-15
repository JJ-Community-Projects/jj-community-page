import {os} from '@orpc/server'
import {editProfileRouter} from "./users/editProfile/editProfileRouter.ts";
import {privateUsersRouter} from "./users/impl.ts";
import {schedulesRouter} from "./schedules/schedulesRouter.ts";
import {twitchRouter} from "./integrations/twitch/twitchRouter.ts";
import {utilsRouter} from "./utils/utilsRouter.ts";
import {authMiddleware} from "../middleware/authMiddleware.ts";
import {privateTeamsRouter} from "./teams/impl.ts";


export const privateRouter = os
  .use(authMiddleware)
  .router({
    users: privateUsersRouter,
    editProfile: editProfileRouter,
    teams: privateTeamsRouter,
    schedules: schedulesRouter,
    integrations: {
      twitch: twitchRouter
    },
    utils: utilsRouter,
  })

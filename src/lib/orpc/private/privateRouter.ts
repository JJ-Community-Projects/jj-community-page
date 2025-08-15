import {os} from '@orpc/server'
import {privateUsersRouter} from "./users/impl.ts";
import {authMiddleware} from "../middleware/authMiddleware.ts";
import {privateTeamsRouter} from "./teams/impl.ts";
import {profileRouter} from "./profile/impl.ts";
import {friendsRouter} from "./friends/impl.ts";
import {blockRouter} from "./blocking/impl.ts";
import {tagsRouter} from "./tags/impl.ts";
import {adminTagsRouter} from "./tagsAdmin/impl.ts";
import {streamTagsRouter} from "./tagsStream/impl.ts";
import {twitchRouter} from "./twitch/twitchRouter.ts";
import {privateSchedulesRouter} from "./schedules/impl.ts";
import {socialRouter} from "./social/impl.ts";


export const privateRouter = os
  .use(authMiddleware)
  .router({
    users: privateUsersRouter,
    profile: profileRouter,
    social: socialRouter,
    friends: friendsRouter,
    blocking: blockRouter,
    tags: tagsRouter,
    adminTags: adminTagsRouter,
    streamTags: streamTagsRouter,
    teams: privateTeamsRouter,
    schedules: privateSchedulesRouter,
    twitch: twitchRouter,
  })

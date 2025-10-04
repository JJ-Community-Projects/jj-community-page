import { privateUsersRouter } from './users/impl.ts'
import { privateTeamsRouter } from './teams/impl.ts'
import { profileRouter } from './profile/impl.ts'
import { friendsRouter } from './friends/impl.ts'
import { blockRouter } from './blocking/impl.ts'
import { tagsRouter } from './tags/impl.ts'
import { adminTagsRouter } from './tagsAdmin/impl.ts'
import { streamTagsRouter } from './tagsStream/impl.ts'
import { twitchRouter } from './twitch/twitchRouter.ts'
import { privateSchedulesRouter } from './schedules/impl.ts'
import { socialRouter } from './social/impl.ts'
import { privateTeamsSSERouter } from './teamsSSE/impl.ts'
import { privateFriendsSSERouter } from './friendsSSE/impl.ts'
import { privateScheduleEditingRouter } from './scheduleEditing'
import { os } from '@orpc/server'
import { hasAstroContext } from '../middleware/hasAstroContext.ts'
import { privateFriendsWSRouter } from './friendsWS/impl.ts'
import { privateTeamsWSRouter } from './teamsWS/impl.ts'
import { privateScheduleEditingWSRouter } from './scheduleEditingWS'
import { adminRouter } from './admin/impl.ts'

export const privateRouter = os.use(hasAstroContext).router({
  admin: adminRouter,
  users: privateUsersRouter,
  profile: profileRouter,
  social: socialRouter,
  friends: friendsRouter,
  friendsSSE: privateFriendsSSERouter,
  friendsWS: privateFriendsWSRouter,
  blocking: blockRouter,
  tags: tagsRouter,
  adminTags: adminTagsRouter,
  streamTags: streamTagsRouter,
  teams: privateTeamsRouter,
  teamsSSE: privateTeamsSSERouter,
  teamsWS: privateTeamsWSRouter,
  schedules: privateSchedulesRouter,
  scheduleEditing: privateScheduleEditingRouter,
  scheduleEditingWS: privateScheduleEditingWSRouter,
  twitch: twitchRouter,
})

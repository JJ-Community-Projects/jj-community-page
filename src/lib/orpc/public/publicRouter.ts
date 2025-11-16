import { os } from '@orpc/server'
import { publicUsersRouter } from './users/impl.ts'
import { publicTeamsRouter } from './teams/impl.ts'
import { publicSchedulesRouter } from './schedules/impl.ts'
import { hasAstroContext } from '../middleware/hasAstroContext.ts'
import { dbMiddleware } from '../middleware/dbMiddleware.ts'
import { overlaysScheduleRouter } from './overlays/schedule/impl.ts'
import { twitchExtensionRouter } from './twitchExtension/impl.ts'
import { publicJJDataRouter } from './jjData/impl.ts'

export const publicRouter = os
  .use(hasAstroContext)
  .use(dbMiddleware)
  .router({
    users: publicUsersRouter,
    teams: publicTeamsRouter,
    schedules: publicSchedulesRouter,
    overlays: {
      schedule: overlaysScheduleRouter,
    },
    twitchExtension: twitchExtensionRouter,
    jjData: publicJJDataRouter,
  })

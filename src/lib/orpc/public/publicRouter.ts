import { os } from '@orpc/server'
import { publicUsersRouter } from './users/impl.ts'
import { publicTeamsRouter } from './teams/impl.ts'
import { publicSchedulesRouter } from './schedules/impl.ts'
import { hasAstroContext } from '../middleware/hasAstroContext.ts'
import { dbMiddleware } from '../middleware/dbMiddleware.ts'
import { jjData } from './causes/impl.ts'

export const publicRouter = os.use(hasAstroContext).use(dbMiddleware).router({
  jjData: jjData,
  users: publicUsersRouter,
  teams: publicTeamsRouter,
  schedules: publicSchedulesRouter,
})

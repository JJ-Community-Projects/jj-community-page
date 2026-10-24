import { os } from '@orpc/server'
import { publicUsersRouter } from './users/impl.ts'
import { publicTeamsRouter } from './teams/impl.ts'
import { publicSchedulesRouter } from './schedules/impl.ts'
import { hasAstroContext } from '../middleware/hasAstroContext.ts'
import { dbMiddleware } from '../middleware/dbMiddleware.ts'
import { overlaysVisibilityRouter } from './overlays/visibility/impl.ts'
import { twitchExtensionRouter } from './twitchExtension/impl.ts'
import { publicTagsRouter } from './tags/impl.ts'

const base = os.use(hasAstroContext).use(dbMiddleware)

/** In-process router for `serverClientPublic` (page frontmatter); not mounted over HTTP. */
export const publicRouter = base.router({
  users: publicUsersRouter,
  teams: publicTeamsRouter,
  schedules: publicSchedulesRouter,
  overlays: {
    visibility: overlaysVisibilityRouter,
  },
  twitchExtension: twitchExtensionRouter,
  tags: publicTagsRouter,
})

/** What `/api/public` serves: only the Twitch extension, same middleware and paths. */
export const publicHttpRouter = base.router({
  twitchExtension: twitchExtensionRouter,
})

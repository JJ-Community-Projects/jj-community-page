import { usersContracts } from './contract.ts'
import { implement } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import {
  assemblePrimaryStreams,
  getUserBySlug as getUserBySlugUtil,
  primarySchedule,
  primaryStreamsQueries,
  userFriendsQuery,
  userSchedulesQuery,
  userSocialsQuery,
  userTagsQuery,
  userTeamsQuery,
} from './util.ts'
import { findRelatedUsersWithJaccard } from '../../../services/relatedUsers.ts'
import { PROFILE_RELATED_USERS_LIMIT } from '../../../services/relatedUsersCache.ts'
import { cached } from '../../middleware/cached.ts'
import { CACHE_POLICY } from '../../../services/cachePolicy.ts'

const bySlug = (input: { slug: string }) => input.slug

const os = implement(usersContracts).use(dbMiddleware)

// The page shows the next streams of the primary schedule, so in season it follows `upcoming`.
const getUserFullProfileBySlug = os.getUserFullProfileBySlugContract
  .use(
    cached('profile', bySlug, {
      eventTtl: CACHE_POLICY.upcoming.eventTtl,
      swr: CACHE_POLICY.upcoming.swr,
    }),
  )
  .handler(
  async ({ context, input }) => {
    const db = context.db

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, input.slug)
    const userId = user.userId

    // Everything else in one batch; related users come from KV in parallel (a miss adds one
    // statement)
    const [
      [tags, socials, friends, teams, schedules, ...primaryStreamResults],
      related,
    ] = await Promise.all([
      db.batch([
        userTagsQuery(db, userId),
        userSocialsQuery(db, userId),
        userFriendsQuery(db, userId),
        userTeamsQuery(db, userId),
        userSchedulesQuery(db, userId),
        ...primaryStreamsQueries(db, userId, new Date()),
      ]),
      findRelatedUsersWithJaccard(
        db,
        context.env,
        userId,
        PROFILE_RELATED_USERS_LIMIT,
      ),
    ])

    return {
      user,
      style: {
        primaryColor: user.primaryColor,
        accentColor: user.accentColor,
      },
      socials,
      tags,
      friends,
      related,
      teams,
      primarySchedule: primarySchedule(schedules),
      schedules,
      nextPrimaryStreams: assemblePrimaryStreams(primaryStreamResults),
    }
  },
)

export const publicUsersRouter = {
  getUserFullProfileBySlug,
}

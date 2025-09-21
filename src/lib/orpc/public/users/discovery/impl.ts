import { discoveryContract } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../../middleware/dbMiddleware.ts'
import {
  userDisplayView,
  usersSearchView,
} from '../../../../db/schema/views-schema.ts'
import { eq, like, or } from 'drizzle-orm'
import { findRelatedUsersWithJaccard } from './util.ts'

const os = implement(discoveryContract).use(dbMiddleware)

const searchByUsernameDisplay = os.byUsernameDisplay.handler(
  async ({ context, input }) => {
    const db = context.db
    const { limit, searchTerm } = input

    try {
      // Search using usersSearchView to find matching users, then get display data from userDisplayView
      const searchPattern = `%${searchTerm.toLowerCase()}%`

      const results = await db
        .select({
          userId: userDisplayView.userId,
          primaryLiveStream: userDisplayView.primaryLiveStream,
          role: userDisplayView.role,
          createdAt: userDisplayView.createdAt,
          username: userDisplayView.username,
          profileImage: userDisplayView.profileImage,
          twitchLogin: userDisplayView.twitchLogin,
          tiltifySlug: userDisplayView.tiltifySlug,
          tiltifyUrl: userDisplayView.tiltifyUrl,
          primaryColor: userDisplayView.primaryColor,
          accentColor: userDisplayView.accentColor,
        })
        .from(userDisplayView)
        .innerJoin(
          usersSearchView,
          eq(userDisplayView.userId, usersSearchView.userId),
        )
        .where(
          or(
            like(usersSearchView.tiltifyUsername, searchPattern),
            like(usersSearchView.twitchUsername, searchPattern),
          ),
        )
        .limit(limit) // Limit results to prevent overwhelming responses
        .all()

      return results
    } catch (error) {
      console.error('Error searching users with display data:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to search users with display data',
      })
    }
  },
)

const searchByUsername = os.searchByUsername.handler(
  async ({ context, input }) => {
    const db = context.db
    const { limit, searchTerm } = input

    try {
      // Search in usersSearchView by checking if the term is like the tiltify or twitch username
      const searchPattern = `%${searchTerm.toLowerCase()}%`

      const results = await db
        .select({
          userId: usersSearchView.userId,
          tiltifyUsername: usersSearchView.tiltifyUsername,
          twitchUsername: usersSearchView.twitchUsername,
        })
        .from(usersSearchView)
        .where(
          or(
            like(usersSearchView.tiltifyUsername, searchPattern),
            like(usersSearchView.twitchUsername, searchPattern),
          ),
        )
        .limit(limit) // Limit results to prevent overwhelming responses
        .all()

      return results
    } catch (error) {
      console.error('Error searching users by username:', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to search users by username',
      })
    }
  },
)

const searchSimilarUsers = os.searchSimilarUsersDisplay.handler(
  async ({ context, input }) => {
    const db = context.db
    const { limit, userId } = input
    return findRelatedUsersWithJaccard(db, context.env, userId, limit)
  },
)

export const discoverRouter = {
  byUsernameDisplay: searchByUsernameDisplay,
  byUsername: searchByUsername,
  similarUsers: searchSimilarUsers,
}

import { usersContracts } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { userDisplayView, usersSearchView, } from '../../../db/schema/views-schema.ts'
import { twitchChannelSchema } from '../../../db/schema/twitch-channel-schema.ts'
import { asc, eq, like, or, sql } from 'drizzle-orm'
import {
  getUserBySlug as getUserBySlugUtil,
  getUserFriends,
  getUserOwnStreams,
  getUserParticipatingStreams,
  getUserPrimaryStreams,
  getUserSchedules,
  getUserSocials,
  getUserTags,
  getUserTeams,
} from './util.ts'
import { users } from '../../../db/schema/auth-schema.ts'
import { userSchedulesRouter } from './schedules/impl.ts'
import { userTeamsRouter } from './teams/impl.ts'
import { tags, userTagsTable } from '../../../db/schema/tags-schema.ts'
import { type SimplePublicTag, SimplePublicTagSchema } from '../schemas/tags.ts'
import { UserDisplaySchema } from '../schemas/UserDisplaySchema.ts'
import { findRelatedUsersWithJaccard } from './discovery/util.ts'

const os = implement(usersContracts).use(dbMiddleware)

const getAllUsers = os.getAllUsersContract.handler(async ({ context }) => {
  const db = context.db
  return db
    .select({
      userId: userDisplayView.userId,
      primaryLiveStream: userDisplayView.primaryLiveStream,
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
    .orderBy(asc(userDisplayView.username))
    .all()
})

const getAllUsersPaged = os.getAllUsersPagedContract.handler(
  async ({ context, input }) => {
    const db = context.db
    const { limit, page } = input
    const offset = (page - 1) * limit

    const totalUserCount = await db.$count(users)

    const totalNumberOfPages = totalUserCount % limit

    // Query users with pagination, ordered alphabetically by username
    const result = await db
      .select({
        userId: userDisplayView.userId,
        primaryLiveStream: userDisplayView.primaryLiveStream,
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
      .orderBy(asc(userDisplayView.username))
      .limit(limit)
      .offset(offset)
      .all()

    return {
      users: result,
      total: totalUserCount,
      totalNumberOfPages: totalNumberOfPages,
      limit: limit,
      currentPage: page,
      hasNextPage: page < totalNumberOfPages,
    }
  },
)

const getUserBySlug = os.getUserBySlugContract.handler(
  async ({ context, input }) => {
    const db = context.db

    const slug = input.slug
    // Query user by tiltify slug
    const user = await db
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
      .where(eq(userDisplayView.tiltifySlug, slug))
      .get()

    if (!user) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found',
      })
    }

    return user
  },
)

const getUserFullProfileBySlug = os.getUserFullProfileBySlugContract.handler(
  async ({ context, input }) => {
    const db = context.db

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, input.slug)
    const userId = user.userId

    // Fetch all user-related data in parallel for optimal performance
    const [tags, socials, friends, teams, scheduleResult] = await Promise.all([
      getUserTags(db, userId),
      getUserSocials(db, userId),
      getUserFriends(db, userId),
      getUserTeams(db, userId),
      getUserSchedules(db, userId),
    ])

    // Extract schedules and primary schedule from result
    const { schedules, primarySchedule } = scheduleResult
    const userScheduleIds = schedules.map((s) => s.id)

    // Fetch streams data in parallel
    const [nextStreams, nextStreamsOthers, nextPrimaryStreams] =
      await Promise.all([
        getUserOwnStreams(db, userScheduleIds),
        getUserParticipatingStreams(db, userId),
        getUserPrimaryStreams(db, primarySchedule?.id),
      ])

    const related = await findRelatedUsersWithJaccard(
      db,
      context.env,
      userId,
      3,
    )

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
      primarySchedule,
      schedules,
      nextStreams,
      nextStreamsOthers,
      nextPrimaryStreams,
    }
  },
)

const getTwitchChannelByUserSlug =
  os.getTwitchChannelByUserSlugContract.handler(async ({ context, input }) => {
    const db = context.db

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, input.slug)
    const userId = user.userId

    // Query Twitch channel data by user ID
    // Return null if no Twitch channel is found for the user
    return db
      .select({
        userId: twitchChannelSchema.userId,
        id: twitchChannelSchema.id,
        login: twitchChannelSchema.login,
        displayName: twitchChannelSchema.displayName,
        description: twitchChannelSchema.description,
        profileImageUrl: twitchChannelSchema.profileImageUrl,
        offlineImageUrl: twitchChannelSchema.offlineImageUrl,
      })
      .from(twitchChannelSchema)
      .where(eq(twitchChannelSchema.userId, userId))
      .get()
  })

const searchByName = os.searchByNameContract.handler(
  async ({ context, input }) => {
    const db = context.db
    const { searchTerm } = input

    // Convert search term to lowercase for case-insensitive matching
    const searchPattern = `%${searchTerm.toLowerCase()}%`

    // Search in both Tiltify and Twitch usernames using the usersSearchView
    // The view already stores lowercase versions of usernames for efficient searching
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
      .limit(20) // Limit results to prevent excessive data transfer
      .all()

    return results
  },
)

const getAllUsersWithTags = os.getAllUsersWithTagsContract.handler(
  async ({ context }) => {
    const db = context.db
    // Subquery: aggregate tags per user into JSON
    const tagsAgg = db
      .select({
        userId: userTagsTable.userId,
        tagsJson: sql<string>`json_group_array(
          json_object(
            'name', ${tags.name},
            'slug', ${tags.slug},
            'color', ${tags.color}
          )
        )`.as('tags_json'),
      })
      .from(userTagsTable)
      .leftJoin(tags, eq(userTagsTable.tagId, tags.id))
      .groupBy(userTagsTable.userId)
      .as('tags_agg')

    const rows = await db
      .select({
        userId: userDisplayView.userId,
        primaryLiveStream: userDisplayView.primaryLiveStream,
        createdAt: userDisplayView.createdAt,
        username: userDisplayView.username,
        profileImage: userDisplayView.profileImage,
        twitchLogin: userDisplayView.twitchLogin,
        tiltifySlug: userDisplayView.tiltifySlug,
        tiltifyUrl: userDisplayView.tiltifyUrl,
        primaryColor: userDisplayView.primaryColor,
        accentColor: userDisplayView.accentColor,
        // Use the pre-aggregated JSON; COALESCE to empty array when no tags
        tags: sql<string>`COALESCE(${tagsAgg.tagsJson}, '[]')`,
      })
      .from(userDisplayView)
      .leftJoin(tagsAgg, eq(userDisplayView.userId, tagsAgg.userId))
      .all()

    const result = rows.map((r) => ({
      ...UserDisplaySchema.parse(r),
      tags: JSON.parse(r.tags).map((t: unknown) =>
        SimplePublicTagSchema.parse(t),
      ) as SimplePublicTag[],
    }))

    console.log(result)
    return result
  },
)

export const publicUsersRouter = {
  getAllUsers,
  getAllUsersPaged,
  getAllUsersWithTags,
  getUserBySlug,
  getUserFullProfileBySlug,
  getTwitchChannelByUserSlug,
  searchByName,
  ...userSchedulesRouter,
  ...userTeamsRouter,
}

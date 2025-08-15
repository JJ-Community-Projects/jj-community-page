import {usersContracts} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {twitchChannelSchema} from '../../../db/schema/twitch-channel-schema.ts';
import {asc, eq} from 'drizzle-orm';
import {
  getUserBySlug as getUserBySlugUtil,
  getUserFriends,
  getUserOwnStreams,
  getUserParticipatingStreams,
  getUserSchedules,
  getUserSocials,
  getUserTags,
  getUserTeams
} from './util.ts';

const os = implement(usersContracts)
  .use(dbMiddleware);


export const getUserBySlug = os.getUserBySlugContract
  .handler(async ({context, input: slug}) => {
    const db = context.db

    // Query user by tiltify slug
    const user = await db.select({
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
      .get();

    if (!user) {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found'
      });
    }

    return user;
  })


export const getUserProfileBySlug = os.getUserProfileBySlugContract
  .handler(async ({context, input: slug}) => {
    const db = context.db

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, slug);
    const userId = user.userId;

    // Fetch all user-related data in parallel for optimal performance
    const [
      tags,
      socials,
      friends,
      teams,
      scheduleResult,
    ] = await Promise.all([
      getUserTags(db, userId),
      getUserSocials(db, userId),
      getUserFriends(db, userId),
      getUserTeams(db, userId),
      getUserSchedules(db, userId),
    ]);

    // Extract schedules and primary schedule from result
    const {schedules, primarySchedule} = scheduleResult;
    const userScheduleIds = schedules.map(s => s.id);

    // Fetch streams data in parallel
    const [nextStreams, nextStreamsOthers] = await Promise.all([
      getUserOwnStreams(db, userScheduleIds),
      getUserParticipatingStreams(db, userId),
    ]);

    return {
      user,
      socials,
      tags,
      friends,
      teams,
      primarySchedule,
      schedules,
      nextStreams,
      nextStreamsOthers,
    };
  })


export const getAllUsersPaged = os.getAllUsersPagedContract
  .handler(async ({context, input}) => {
    const db = context.db
    const {limit, page} = input;
    const offset = (page - 1) * limit;

    // Query users with pagination, ordered alphabetically by username
    return db.select({
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
      .all();
  })


export const getAllUsers = os.getAllUsersContract
  .handler(async ({context}) => {
    const db = context.db
    return db.select({
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
      .all();
  })


export const getTwitchChannelByUserId = os.getTwitchChannelByUserIdContract
  .handler(async ({context, input: userId}) => {
    const db = context.db

    // Query Twitch channel data by user ID
    const twitchChannel = await db.select({
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
      .get();

    // Return null if no Twitch channel is found for the user
    return twitchChannel || null;
  })

export const getTwitchChannelByUserSlug = os.getTwitchChannelByUserSlugContract
  .handler(async ({context, input: slug}) => {
    const db = context.db

    // Fetch user by slug (throws NOT_FOUND if user doesn't exist)
    const user = await getUserBySlugUtil(db, slug);
    const userId = user.userId;

    // Query Twitch channel data by user ID
    const twitchChannel = await db.select({
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
      .get();

    // Return null if no Twitch channel is found for the user
    return twitchChannel || null;
  })

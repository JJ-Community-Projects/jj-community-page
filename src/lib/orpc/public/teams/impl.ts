import {publicTeamsContract} from './contract.ts';
import {implement, ORPCError} from '@orpc/server';
import {dbMiddleware} from '../../middleware/dbMiddleware.ts';
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
  teamMembersTable,
  teamsTable
} from '../../../db/schema/jj-schema.ts';
import {userDisplayView} from '../../../db/schema/views-schema.ts';
import {and, count, eq, gte, inArray, sql} from 'drizzle-orm';
import {getNextStreams, getScheduleStreams, organizeStreamsByTime} from '../schedules/util.ts';

const os = implement(publicTeamsContract)
  .use(dbMiddleware);

/**
 * Find all visible teams with member counts
 * Returns all teams where visible = true, including member count for each team
 */
const findVisible = os.findVisibleTeamsContract
  .handler(async ({context}) => {
    const db = context.db;

    // Get all visible teams
    const teams = await db.select({
      id: teamsTable.id,
      name: teamsTable.name,
      slug: teamsTable.slug,
      description: teamsTable.description,
      visible: teamsTable.visible,
      ownerId: teamsTable.ownerId,
    })
      .from(teamsTable)
      .where(eq(teamsTable.visible, true))
      .all();

    // Get member counts for each team
    const teamsWithMemberCounts = await Promise.all(
      teams.map(async (team) => {
        const memberCountResult = await db.select({
          count: count()
        })
          .from(teamMembersTable)
          .where(eq(teamMembersTable.teamId, team.id))
          .get();

        return {
          ...team,
          memberCount: memberCountResult?.count ?? 0
        };
      })
    );

    return teamsWithMemberCounts;
  });


/**
 * Get team by slug with owner information
 * Returns team details with owner info for public viewing
 */
const getBySlug = os.getBySlugContract
  .handler(async ({context, input}) => {
    const db = context.db;
    const {slug} = input;

    const team = await db.select({
      id: teamsTable.id,
      name: teamsTable.name,
      slug: teamsTable.slug,
      description: teamsTable.description,
      visible: teamsTable.visible,
      ownerId: teamsTable.ownerId,
    })
      .from(teamsTable)
      .where(
        eq(teamsTable.slug, slug),
      )
      .get();

    if (!team) {
      throw new ORPCError('NOT_FOUND')
    }

    if (!team.visible) {
      throw new ORPCError('FORBIDDEN', {message: 'Team is private'})
    }

    const teamMembers = await db.select({
      count: count()
    })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.teamId, team.id))
      .get();


    return {...team, memberCount: teamMembers?.count ?? 0};
  });

/**
 * Get team members by team ID in user display format
 * Returns team member details for public viewing (only for visible teams)
 */
const getMembers = os.getMembersContract
  .handler(async ({context, input}) => {
    const db = context.db;
    const {slug} = input;

    try {
      // First check if team exists and is visible
      const team = await db.select()
        .from(teamsTable)
        .where(and(
          eq(teamsTable.slug, slug),
          eq(teamsTable.visible, true)
        ))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible'
        });
      }

      // Get team members in user display format
      const members = await db.select({
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
        accentColor: userDisplayView.accentColor
      })
        .from(teamMembersTable)
        .innerJoin(userDisplayView, eq(teamMembersTable.userId, userDisplayView.userId))
        .where(eq(teamMembersTable.teamId, team.id))
        .all();

      return {members};
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team members:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team members'
      });
    }
  });

/**
 * Get all primary schedules of team members for a given year
 * Returns primary schedules from all team members for the specified year
 */
const getTeamSchedulesByYear = os.getTeamSchedulesByYearContract
  .handler(async ({context, input}) => {
    const db = context.db;
    const {slug, year} = input;

    try {
      // First check if team exists and is visible
      const team = await db.select()
        .from(teamsTable)
        .where(and(
          eq(teamsTable.slug, slug),
          eq(teamsTable.visible, true)
        ))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible'
        });
      }

      // Get all team member user IDs
      const teamMembers = await db.select({
        userId: teamMembersTable.userId
      })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, team.id))
        .all();

      if (teamMembers.length === 0) {
        return [];
      }

      const memberUserIds = teamMembers.map(member => member.userId);

      // Get primary schedules for all team members for the specified year
      const schedules = await db.select({
        id: schedulesTable.id,
        title: schedulesTable.title,
        slug: schedulesTable.slug,
        year: schedulesTable.year,
        visible: schedulesTable.visible,
        primary: schedulesTable.primary,
        ownerId: schedulesTable.ownerId,
        createdAt: schedulesTable.createdAt,
        updatedAt: schedulesTable.updatedAt,
      })
        .from(schedulesTable)
        .where(and(
          inArray(schedulesTable.ownerId, memberUserIds),
          eq(schedulesTable.year, year),
          eq(schedulesTable.primary, true),
          eq(schedulesTable.visible, true)
        ))
        .all();

      return schedules;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team schedules by year:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team schedules'
      });
    }
  });

/**
 * Get next n streams from all team member schedules
 * Returns upcoming streams from all team members with optional uniqueness filtering
 */
const getTeamNextStreams = os.getTeamNextStreamsContract
  .handler(async ({context, input}) => {
    const db = context.db;
    const {slug, limit = 10, unique = false} = input;

    const currentYear = new Date().getFullYear()

    try {
      // First check if team exists and is visible
      const team = await db.select()
        .from(teamsTable)
        .where(and(
          eq(teamsTable.slug, slug),
          eq(teamsTable.visible, true)
        ))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible'
        });
      }

      // Get all team member user IDs
      const teamMembers = await db.select({
        userId: teamMembersTable.userId
      })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, team.id))
        .all();

      if (teamMembers.length === 0) {
        return [];
      }

      const memberUserIds = teamMembers.map(member => member.userId);
      const currentTime = new Date();

      // Get all upcoming streams from team member schedules
      const streams = await db.select({
        id: streamsTable.id,
        scheduleId: streamsTable.scheduleId,
        createdBy: streamsTable.createdBy,
        title: streamsTable.title,
        visible: streamsTable.visible,
        subtitle: streamsTable.subtitle,
        description: streamsTable.description,
        youtubeVodUrl: streamsTable.youtubeVodUrl,
        twitchVodUrl: streamsTable.twitchVodUrl,
        start: streamsTable.start,
        end: streamsTable.end,
        tags: sql<any[]>`'[]'`,
        participants: sql<any[]>`'[]'`
      })
        .from(streamsTable)
        .innerJoin(schedulesTable, eq(streamsTable.scheduleId, schedulesTable.id))
        .where(and(
          inArray(schedulesTable.ownerId, memberUserIds),
          eq(streamsTable.visible, true),
          eq(schedulesTable.visible, true),
          eq(schedulesTable.primary, true),
          eq(schedulesTable.year, currentYear),
          gte(streamsTable.start, currentTime)
        ))
        .orderBy(streamsTable.start)
        .all();

      if (streams.length === 0) {
        return [];
      }

      // Apply unique filtering if requested
      let filteredStreams = streams;
      if (unique) {
        const seenCreators = new Set<number>();
        filteredStreams = streams.filter(stream => {
          if (seenCreators.has(stream.createdBy)) {
            return false;
          }
          seenCreators.add(stream.createdBy);
          return true;
        });
      }

      // Apply limit
      const limitedStreams = filteredStreams.slice(0, limit);

      // Get stream participants for each stream
      const participantsByStream = new Map<string, any[]>();

      if (limitedStreams.length > 0) {
        // Get participants for each stream individually to avoid complex composite key queries
        for (const stream of limitedStreams) {
          const participantsData = await db.select({
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
            accentColor: userDisplayView.accentColor
          })
            .from(streamParticipantsTable)
            .innerJoin(userDisplayView, eq(streamParticipantsTable.userId, userDisplayView.userId))
            .where(and(
              eq(streamParticipantsTable.scheduleId, stream.scheduleId),
              eq(streamParticipantsTable.streamId, stream.id)
            ))
            .all();

          const key = `${stream.scheduleId}-${stream.id}`;
          participantsByStream.set(key, participantsData);
        }

        // Attach participants to streams
        return limitedStreams.map(stream => ({
          ...stream,
          participants: participantsByStream.get(`${stream.scheduleId}-${stream.id}`) || []
        }));
      }

      return limitedStreams;
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team next streams:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team next streams'
      });
    }
  });

/**
 * Get team's full schedule for a given year
 * Returns complete schedule information with all streams from all team members' primary schedules
 */
const getTeamFullScheduleByYear = os.getTeamFullScheduleByYearContract
  .handler(async ({context, input}) => {
    const db = context.db;
    const {slug, year} = input;

    try {
      // First check if team exists and is visible
      const team = await db.select()
        .from(teamsTable)
        .where(and(
          eq(teamsTable.slug, slug),
          eq(teamsTable.visible, true)
        ))
        .get();

      if (!team) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible'
        });
      }

      // Get all team member user IDs
      const teamMembers = await db.select({
        userId: teamMembersTable.userId
      })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, team.id))
        .all();

      if (teamMembers.length === 0) {
        // Return empty schedule structure
        return {
          data: {
            id: 0,
            title: `${team.name} Team Schedule ${year}`,
            slug: `${team.slug}-${year}`,
            year: year,
            visible: true,
            primary: true,
            ownerId: team.ownerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          streams: [],
          nextStreams: [],
          days: [],
          weeks: [],
          participants: [],
        };
      }

      const memberUserIds = teamMembers.map(member => member.userId);

      // Get primary schedules for all team members for the specified year
      const schedules = await db.select({
        id: schedulesTable.id,
        title: schedulesTable.title,
        slug: schedulesTable.slug,
        year: schedulesTable.year,
        visible: schedulesTable.visible,
        primary: schedulesTable.primary,
        ownerId: schedulesTable.ownerId,
        createdAt: schedulesTable.createdAt,
        updatedAt: schedulesTable.updatedAt,
      })
        .from(schedulesTable)
        .where(and(
          inArray(schedulesTable.ownerId, memberUserIds),
          eq(schedulesTable.year, year),
          eq(schedulesTable.primary, true),
          eq(schedulesTable.visible, true)
        ))
        .all();

      if (schedules.length === 0) {
        // Return empty schedule structure
        return {
          data: {
            id: 0,
            title: `${team.name} Team Schedule ${year}`,
            slug: `${team.slug}-${year}`,
            year: year,
            visible: true,
            primary: true,
            ownerId: team.ownerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          streams: [],
          nextStreams: [],
          days: [],
          weeks: [],
          participants: [],
        };
      }

      // Get all streams from all schedules and aggregate them
      const allStreams = [];
      for (const schedule of schedules) {
        const scheduleStreams = await getScheduleStreams(db, schedule.id);
        allStreams.push(...scheduleStreams);
      }

      // Sort streams by start time
      allStreams.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      // Get the next 3 future streams
      const nextStreams = getNextStreams(allStreams);

      // Organize streams by time
      const {days, weeks} = organizeStreamsByTime(allStreams);

      // Get all unique participants
      const participants = Array.from(
        new Map(
          allStreams.flatMap(stream => stream.participants)
            .map(participant => [participant.userId, participant])
        ).values()
      );

      // Create aggregated schedule data
      const scheduleData = {
        id: 0, // Virtual schedule ID for team aggregate
        title: `${team.name} Team Schedule ${year}`,
        slug: `${team.slug}-${year}`,
        year: year,
        visible: true,
        primary: true,
        ownerId: team.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        data: scheduleData,
        streams: allStreams,
        nextStreams,
        days,
        weeks,
        participants,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error('Error getting team full schedule by year:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team full schedule'
      });
    }
  });


export const publicTeamsRouter = {
  findVisible,
  getBySlug,
  getMembers,
  getTeamSchedulesByYear,
  getTeamNextStreams,
  getTeamFullScheduleByYear,
};

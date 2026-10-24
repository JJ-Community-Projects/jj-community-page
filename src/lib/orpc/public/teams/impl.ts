import { publicTeamsContract } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import {
  schedulesTable,
  streamParticipantsTable,
  streamsTable,
  teamMembersTable,
  teamsTable,
} from '../../../db/schema/jj-schema.ts'
import {
  streamTagsTable,
  tags as tagsTable,
} from '../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../db/schema/views-schema.ts'
import { and, asc, count, eq, gte, inArray, sql, type Column } from 'drizzle-orm'
import type { JJDrizzleDatabase } from '../../../db/db.ts'
import type { UserDisplay } from '../users/util.ts'
import { byInput, cached } from '../../middleware/cached.ts'
import { CACHE_POLICY } from '../../../services/cachePolicy.ts'

const os = implement(publicTeamsContract).use(dbMiddleware)

const bySlug = (input: { slug: string }) => input.slug

/**
 * The id of the visible team with this slug: a statement of its own (no row: missing or hidden), or
 * a scalar subquery that keys the other statements of the same batch.
 */
const visibleTeamId = (db: JJDrizzleDatabase, slug: string) =>
  db
    .select({ id: teamsTable.id })
    .from(teamsTable)
    .where(and(eq(teamsTable.slug, slug), eq(teamsTable.visible, true)))

/**
 * Find all visible teams with member counts
 * Returns all teams where visible = true, including member count for each team
 */
const findVisible = os.findVisibleTeamsContract
  .use(cached('team', () => ''))
  .handler(async ({ context }) => {
  const db = context.db

  // Get all visible teams
  const teams = await db
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      slug: teamsTable.slug,
      description: teamsTable.description,
      visible: teamsTable.visible,
      ownerId: teamsTable.ownerId,
    })
    .from(teamsTable)
    .where(eq(teamsTable.visible, true))
    .all()

  // Get member counts for each team
  const teamsWithMemberCounts = await Promise.all(
    teams.map(async (team) => {
      const memberCountResult = await db
        .select({
          count: count(),
        })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, team.id))
        .get()

      return {
        ...team,
        memberCount: memberCountResult?.count ?? 0,
      }
    }),
  )

  return teamsWithMemberCounts
})

/**
 * Get team by slug with owner information
 * Returns team details with owner info for public viewing
 */
const getBySlug = os.getBySlugContract
  .use(cached('team', bySlug))
  .handler(async ({ context, input }) => {
  const db = context.db
  const { slug } = input

  // One statement: the team and its member count
  const team = await db
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      slug: teamsTable.slug,
      description: teamsTable.description,
      visible: teamsTable.visible,
      ownerId: teamsTable.ownerId,
      memberCount: db.$count(
        teamMembersTable,
        eq(teamMembersTable.teamId, teamsTable.id),
      ),
    })
    .from(teamsTable)
    .where(eq(teamsTable.slug, slug))
    .get()

  if (!team) {
    throw new ORPCError('NOT_FOUND')
  }

  if (!team.visible) {
    throw new ORPCError('FORBIDDEN', { message: 'Team is private' })
  }

  return team
})

/**
 * Get team members by team ID in user display format
 * Returns team member details for public viewing (only for visible teams)
 */
const getMembers = os.getMembersContract
  .use(cached('team', bySlug))
  .handler(async ({ context, input }) => {
  const db = context.db
  const { slug } = input

  try {
    // One round trip: whether the team exists and is visible, and its members in user display
    // format
    const [team, members] = await db.batch([
      visibleTeamId(db, slug),
      db
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
        .from(teamMembersTable)
        .innerJoin(
          userDisplayView,
          eq(teamMembersTable.userId, userDisplayView.userId),
        )
        .where(eq(teamMembersTable.teamId, visibleTeamId(db, slug))),
    ])

    if (team.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Team not found or not visible',
      })
    }

    return { members }
  } catch (error) {
    if (error instanceof ORPCError) throw error
    console.error('Error getting team members:', error)
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to retrieve team members',
    })
  }
})

/**
 * Get next n streams from all team member schedules
 * Returns upcoming streams from all team members with optional uniqueness filtering
 */
// Its NOT_FOUND means "no such visible team": cached like the team's own (the team page asks all
// three team procedures at once).
const getTeamNextStreams = os.getTeamNextStreamsContract
  .use(
    cached('upcoming', byInput, {
      negativeTtl: CACHE_POLICY.team.negativeTtl,
    }),
  )
  .handler(
  async ({ context, input }) => {
    const db = context.db
    const { slug, limit = 10, unique = false } = input

    // Normalize limit per contract (default 10, max 50, min 1)
    const normalizedLimit = Math.min(50, Math.max(1, limit ?? 10))

    const currentYear = new Date().getUTCFullYear()

    try {
      // 1) One round trip: whether the team exists and is visible, and the upcoming streams of the
      //    members' primary schedules of this year
      const currentTime = new Date()
      const [team, streams] = await db.batch([
        visibleTeamId(db, slug),
        db
          .select({
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
          })
          .from(streamsTable)
          .innerJoin(
            schedulesTable,
            eq(streamsTable.scheduleId, schedulesTable.id),
          )
          .where(
            and(
              inArray(
                schedulesTable.ownerId,
                db
                  .select({ userId: teamMembersTable.userId })
                  .from(teamMembersTable)
                  .where(eq(teamMembersTable.teamId, visibleTeamId(db, slug))),
              ),
              eq(streamsTable.visible, true),
              eq(schedulesTable.visible, true),
              eq(schedulesTable.primary, true),
              eq(schedulesTable.year, currentYear),
              gte(streamsTable.start, currentTime),
            ),
          )
          .orderBy(streamsTable.start),
      ])

      if (team.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Team not found or not visible',
        })
      }

      if (streams.length === 0) {
        return []
      }

      // Apply unique filtering if requested
      let filteredStreams = streams
      if (unique) {
        const seenCreators = new Set<number>()
        filteredStreams = streams.filter((stream) => {
          if (seenCreators.has(stream.createdBy)) {
            return false
          }
          seenCreators.add(stream.createdBy)
          return true
        })
      }

      // Apply limit (normalized)
      const limitedStreams = filteredStreams.slice(0, normalizedLimit)

      // Early return if none
      if (limitedStreams.length === 0) return []

      // 2) Participants and tags of the selected streams in one batch, keyed by the (schedule_id,
      //    stream_id) pairs passed as one JSON parameter (as in jj.upcomingStreams)
      const selected = sql`json_each(${JSON.stringify(
        limitedStreams.map((s) => [s.scheduleId, s.id]),
      )}) as "selected"`
      const isSelected = (scheduleId: Column, streamId: Column) =>
        and(
          eq(scheduleId, sql`"selected"."value" ->> 0`),
          eq(streamId, sql`"selected"."value" ->> 1`),
        )

      const [participantRows, tagRows] = await db.batch([
        db
          .select({
            scheduleId: streamParticipantsTable.scheduleId,
            streamId: streamParticipantsTable.streamId,
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
          .from(selected)
          .innerJoin(
            streamParticipantsTable,
            isSelected(
              streamParticipantsTable.scheduleId,
              streamParticipantsTable.streamId,
            ),
          )
          .innerJoin(
            userDisplayView,
            eq(streamParticipantsTable.userId, userDisplayView.userId),
          )
          .orderBy(
            asc(streamParticipantsTable.scheduleId),
            asc(streamParticipantsTable.streamId),
            asc(streamParticipantsTable.userId),
          ),
        db
          .select({
            scheduleId: streamTagsTable.scheduleId,
            streamId: streamTagsTable.streamId,
            name: tagsTable.name,
            slug: tagsTable.slug,
            color: tagsTable.color,
          })
          .from(selected)
          .innerJoin(
            streamTagsTable,
            isSelected(streamTagsTable.scheduleId, streamTagsTable.streamId),
          )
          .innerJoin(
            tagsTable,
            and(
              eq(streamTagsTable.tagId, tagsTable.id),
              // Unary + keeps the planner off idx_tags_visible: it started the join from every
              // visible tag (seed: 302 rows instead of a few)
              sql`+${tagsTable.visible} = 1`,
            ),
          )
          .orderBy(
            asc(streamTagsTable.scheduleId),
            asc(streamTagsTable.streamId),
            asc(streamTagsTable.tagId),
          ),
      ])

      const participantsByStream = new Map<string, UserDisplay[]>()
      for (const { scheduleId, streamId, ...participant } of participantRows) {
        const key = `${scheduleId}-${streamId}`
        const list = participantsByStream.get(key) ?? []
        list.push(participant)
        participantsByStream.set(key, list)
      }

      const tagsByStream = new Map<
        string,
        { name: string; slug: string; color: string }[]
      >()
      for (const row of tagRows) {
        const key = `${row.scheduleId}-${row.streamId}`
        const list = tagsByStream.get(key) ?? []
        list.push({ name: row.name, slug: row.slug, color: row.color })
        tagsByStream.set(key, list)
      }

      // Shape final output to comply with StreamSchema
      return limitedStreams.map((s) => {
        const key = `${s.scheduleId}-${s.id}`
        const participants = participantsByStream.get(key) ?? []
        const tags = tagsByStream.get(key) ?? []
        return {
          ...s,
          start: s.start instanceof Date ? s.start : new Date(s.start as any),
          end: s.end instanceof Date ? s.end : new Date(s.end as any),
          tags,
          participants,
        }
      })
    } catch (error) {
      console.error('Error getting team next streams:', error)
      if (error instanceof ORPCError) throw error
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to retrieve team next streams',
      })
    }
  },
)

export const publicTeamsRouter = {
  findVisible,
  getBySlug,
  getMembers,
  getTeamNextStreams,
}

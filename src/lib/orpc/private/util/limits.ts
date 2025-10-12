import { and, count, eq, gte, lt } from 'drizzle-orm'
import { teamMembersTable, teamsTable, schedulesTable } from '../../../db/schema/jj-schema.ts'
import { userTagsTable } from '../../../db/schema/tags-schema.ts'
import { editStreamTagsTable } from '../../../db/schema/edit-stream-tags-schema.ts'
import { editStreamsTable } from '../../../db/schema/edit-streams-schema.ts'
import type { JJDrizzleDatabase } from '../../../db/db.ts'

// Centralized limits used across private procedures
export const SCHEDULES_PER_USER_PER_YEAR = 3
export const TAGS_PER_USER = 10
export const TEAMS_PER_USER = 10 // Max teams a user can be a member of
export const TEAM_OWNER_PER_USER = 5 // Max teams a user can own
export const TAGS_PER_STREAM = 10
export const STREAMS_PER_DATE = 8

/**
 * Compute whether the given user can create another team (as owner).
 * Returns the current owned team count and a boolean flag.
 */
export async function checkCanCreateTeam(
  db: JJDrizzleDatabase,
  userId: number,
) {
  const res = await (db as any)
  .select({ c: count() })
  .from(teamsTable)
  .where(eq(teamsTable.ownerId, userId))
  .get()
  const teams = res?.c ?? 0
  return { canCreate: teams < TEAM_OWNER_PER_USER, teams, maxOwnedTeams: TEAM_OWNER_PER_USER } as const
}

/**
 * Compute whether the given user can be invited to another team (membership limit).
 * Returns the current team membership count and a boolean flag.
 */
export async function checkCanInviteUser(
  db: JJDrizzleDatabase,
  userId: number,
) {
  const res = await (db as any)
  .select({ c: count() })
  .from(teamMembersTable)
  .where(eq(teamMembersTable.userId, userId))
  .get()
  const teams = res?.c ?? 0
  return { canInvite: teams < TEAMS_PER_USER, teams, maxTeams: TEAMS_PER_USER } as const
}

/**
 * Compute whether the current user can add another tag to their profile.
 */
export async function checkCanAddTagToUser(
  db: JJDrizzleDatabase,
  userId: number,
) {
  const res = await (db as any)
  .select({ c: count() })
  .from(userTagsTable)
  .where(eq(userTagsTable.userId, userId))
  .get()
  const tags = res?.c ?? 0
  return { canAdd: tags < TAGS_PER_USER, tags, maxTags: TAGS_PER_USER } as const
}

/**
 * Compute whether a stream can accept another tag in the draft editing table.
 */
export async function checkCanAddTagToStream(
  db: JJDrizzleDatabase,
  scheduleId: number,
  streamId: number,
) {
  const res = await (db as any)
  .select({ c: count() })
  .from(editStreamTagsTable)
  .where(and(
    eq(editStreamTagsTable.scheduleId, scheduleId),
    eq(editStreamTagsTable.streamId, streamId),
  ))
  .get()
  const tags = res?.c ?? 0
  return { canAdd: tags < TAGS_PER_STREAM, tags, maxTags: TAGS_PER_STREAM } as const
}

/**
 * Compute whether another stream can be added on the given date for a schedule in draft editing.
 */
export async function checkCanAddStreamOnDate(
  db: JJDrizzleDatabase,
  scheduleId: number,
  date: Date,
) {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
  const endOfDay = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0))
  const res = await (db as any)
  .select({ c: count() })
  .from(editStreamsTable)
  .where(and(
    eq(editStreamsTable.scheduleId, scheduleId),
    gte(editStreamsTable.start, startOfDay as any),
    lt(editStreamsTable.start, endOfDay as any),
  ))
  .get()
  const streams = res?.c ?? 0
  return { canAdd: streams < STREAMS_PER_DATE, streams, date, maxStreams: STREAMS_PER_DATE } as const
}

/**
 * Compute whether the user can create another schedule for the given year.
 */
export async function checkCanCreateSchedule(
  db: JJDrizzleDatabase,
  userId: number,
  year: number,
) {
  const res = await (db as any)
  .select({ c: count() })
  .from(schedulesTable)
  .where(and(
    eq(schedulesTable.ownerId, userId),
    eq(schedulesTable.year, year),
  ))
  .get()
  const schedules = res?.c ?? 0
  return { canCreate: schedules < SCHEDULES_PER_USER_PER_YEAR, schedules, year, maxSchedules: SCHEDULES_PER_USER_PER_YEAR } as const
}

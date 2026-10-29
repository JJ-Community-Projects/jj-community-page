import { and, count, eq } from 'drizzle-orm'
import { teamMembersTable, teamsTable, schedulesTable } from '../../../db/schema/jj-schema.ts'
import { userTagsTable } from '../../../db/schema/tags-schema.ts'
import type { JJDrizzleDatabase } from '../../../db/db.ts'

// Centralized limits used across private procedures
export const SCHEDULES_PER_USER_PER_YEAR = 3
export const TAGS_PER_USER = 10
export const TAGS_PER_STREAM = 10
export const TEAMS_PER_USER = 10 // Max teams a user can be a member of
export const TEAM_OWNER_PER_USER = 5 // Max teams a user can own
export const STREAMS_PER_DATE = 8

/**
 * Compute whether the given user can create another team (as owner).
 * Returns the current owned team count and a boolean flag.
 */
export async function checkCanCreateTeam(
  db: JJDrizzleDatabase,
  userId: number,
) {
  return canCreateTeamFrom(await ownedTeamsCount(db, userId))
}

/** The owned-team count as a statement, so it can run inside a `db.batch` (see `canCreateTeamFrom`). */
export const ownedTeamsCount = (db: JJDrizzleDatabase, userId: number) =>
  db.select({ c: count() }).from(teamsTable).where(eq(teamsTable.ownerId, userId))

export const canCreateTeamFrom = (rows: { c: number }[]) => {
  const teams = rows[0]?.c ?? 0
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
  return canAddTagFrom(await userTagsCount(db, userId))
}

/** The user's tag count as a statement, so it can run inside a `db.batch` (see `canAddTagFrom`). */
export const userTagsCount = (db: JJDrizzleDatabase, userId: number) =>
  db.select({ c: count() }).from(userTagsTable).where(eq(userTagsTable.userId, userId))

export const canAddTagFrom = (rows: { c: number }[]) => {
  const tags = rows[0]?.c ?? 0
  return { canAdd: tags < TAGS_PER_USER, tags, maxTags: TAGS_PER_USER } as const
}

/** Whether a stream may have these tags (TAGS_PER_STREAM); `tagIds` is the stream's full tag list. */
export function streamTagLimit(tagIds: number[]) {
  const tags = new Set(tagIds).size
  return { canSet: tags <= TAGS_PER_STREAM, tags, maxTags: TAGS_PER_STREAM } as const
}

/** Whether another stream fits on `date` (STREAMS_PER_DATE), from the start times of the draft's streams. */
export function streamDateLimitFromStarts(starts: Date[], date: Date) {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  const startOfDay = Date.UTC(y, m, d, 0, 0, 0, 0)
  const endOfDay = Date.UTC(y, m, d + 1, 0, 0, 0, 0)
  const streams = starts.filter(
    (s) => s.getTime() >= startOfDay && s.getTime() < endOfDay,
  ).length
  return { canAdd: streams < STREAMS_PER_DATE, streams, date, maxStreams: STREAMS_PER_DATE } as const
}

/**
 * The per-date limit for streams that move. `current` holds the start of every draft stream of the
 * schedule, `moves` the new start of each moved stream. Each moved stream is checked like a new
 * one (`streamDateLimitFromStarts`) against the other streams after all moves, so it doesn't count
 * against its own day twice. A day that doesn't gain streams is never refused (a move within a day,
 * or a swap). Returns the limit of the first refused move, or null.
 */
export function movedStreamsDateLimit(
  current: Map<number, Date>,
  moves: Map<number, Date>,
) {
  const final = new Map(current)
  for (const [id, start] of moves) final.set(id, start)
  const startsOf = (streams: Map<number, Date>, except?: number) =>
    [...streams].filter(([id]) => id !== except).map(([, start]) => start)
  for (const [id, start] of moves) {
    const limit = streamDateLimitFromStarts(startsOf(final, id), start)
    if (limit.canAdd) continue
    const before = streamDateLimitFromStarts(startsOf(current), start).streams
    if (limit.streams + 1 > before) return limit
  }
  return null
}

/** The user's schedule count for `year` as a statement, for a `db.batch` (see `canCreateScheduleFrom`). */
export const yearSchedulesCount = (db: JJDrizzleDatabase, userId: number, year: number) =>
  db.select({ c: count() }).from(schedulesTable).where(and(
    eq(schedulesTable.ownerId, userId),
    eq(schedulesTable.year, year),
  ))

export const canCreateScheduleFrom = (rows: { c: number }[], year: number) => {
  const schedules = rows[0]?.c ?? 0
  return { canCreate: schedules < SCHEDULES_PER_USER_PER_YEAR, schedules, year, maxSchedules: SCHEDULES_PER_USER_PER_YEAR } as const
}

import { and, eq } from 'drizzle-orm'
import type { JJDrizzleDatabase } from '../db/db.ts'
import { accounts } from '../db/schema/auth-schema.ts'
import { teamMembersTable } from '../db/schema/jj-schema.ts'
import type { CacheEntity } from './cachePolicy.ts'
import { byInput, edgeCacheKey, forgetEdgeCached } from './edgeCache.ts'

// Hiding (or showing) a schedule or team drops the public answers that show it from the edge cache,
// which would otherwise serve them for up to TTL + SWR (P5-2). Each entry is [entity, procedure path
// in the public router, key], as `cached()` builds it there.
// `caches.default` is per data center: this clears the one the owner's request runs in. Elsewhere the
// old answer lives until its TTL, and the first refresh after that drops it (FORBIDDEN, edgeCache.ts).
// Answers keyed by free-form input (next streams, overlays, team schedules) are not listed: they
// follow their TTL.

type Entry = [entity: CacheEntity, path: string, key: string]

const forget = (requestUrl: string, entries: Entry[]) =>
  forgetEdgeCached(entries.map((entry) => edgeCacheKey(requestUrl, entry)))

/** A user's profile and their schedule / team lists, by their Tiltify slug. */
const userEntries = (userSlug: string): Entry[] => [
  ['profile', 'users.getUserFullProfileBySlug', userSlug],
  ['schedule', 'users.getPrimaryScheduleInfoByUserSlug', userSlug],
  ['schedule', 'users.getPrimaryFullScheduleByUserSlug', userSlug],
  ['schedule', 'users.getScheduleInfoByUserSlug', userSlug],
  ['schedule', 'users.getFullScheduleByUserSlug', userSlug],
  ['team', 'users.getTeamsByUserSlug', userSlug],
]

/** After a schedule's visibility changed: its page, its year's primary list and its owner's pages. */
export async function forgetPublicSchedule(
  requestUrl: string,
  schedule: { slug: string; year: number },
  ownerSlug: string,
) {
  await forget(requestUrl, [
    ['schedule', 'schedules.getFullScheduleBySlug', schedule.slug],
    [
      'schedule',
      'schedules.getVisiblePrimarySchedulesByYear',
      byInput({ year: schedule.year }),
    ],
    ...userEntries(ownerSlug),
  ])
}

/** After a team's visibility changed: the team list, its page and every member's pages. */
export async function forgetPublicTeam(
  db: JJDrizzleDatabase,
  requestUrl: string,
  team: { id: number; slug: string },
) {
  const members = await db
    .select({ slug: accounts.tiltifySlug })
    .from(teamMembersTable)
    .innerJoin(
      accounts,
      and(
        eq(accounts.userId, teamMembersTable.userId),
        eq(accounts.provider, 'tiltify'),
      ),
    )
    .where(eq(teamMembersTable.teamId, team.id))
  await forget(requestUrl, [
    ['team', 'teams.findVisible', ''],
    ['team', 'teams.getBySlug', team.slug],
    ['team', 'teams.getMembers', team.slug],
    ...members.flatMap(({ slug }) => (slug ? userEntries(slug) : [])),
  ])
}

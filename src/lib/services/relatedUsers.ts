import type { JJDrizzleDatabase } from '../db/db.ts'
import { and, asc, count, desc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm'
import { alias, type SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { userTagsTable } from '../db/schema/tags-schema.ts'
import { userDisplayView } from '../db/schema/views-schema.ts'
import { blockedUsers } from '../db/schema/auth-schema.ts'
import { UserDisplaySchema } from '../orpc/private/schemas/users.ts'
import { z } from 'zod/v4'
import {
  getCachedRelatedUsers,
  setCachedRelatedUsers,
} from './relatedUsersCache.ts'

const UserSchema = UserDisplaySchema.extend({
  sharedTags: z.number(),
  jaccard: z.number(),
})

const UserArraySchema = z.array(UserSchema)

type User = z.infer<typeof UserSchema>

export async function findRelatedUsersWithJaccard(
  db: JJDrizzleDatabase,
  env: Env,
  userId: number,
  limit = 10,
): Promise<User[]> {
  // Try the full-response cache first
  const cached = await getCachedRelatedUsers(env, userId, limit)
  if (cached) {
    const arr: any[] = JSON.parse(cached)
    const arr2 = arr.map((e: any) => {
      return {
        ...e,
        createdAt: new Date(e.createdAt),
      }
    })
    return UserArraySchema.parse(arr2)
  }

  // One statement: candidates share at least one tag and aren't blocked either way; ranked by the
  // Jaccard index of the two tag sets (ties: lower user id first), top `limit`, then their display
  // rows. A candidate without a display row (no Tiltify account) still takes a place, as before.
  // The ranking sits one level above the grouping: ordering the grouped query itself evaluated the
  // per-candidate tag count twice (measured on the seed: 826 vs 720 rows for 10 tags).
  const otherTags = alias(userTagsTable, 'other_tags')
  const tagCount = (user: SQLiteColumn | number) =>
    db
      .select({ count: count() })
      .from(otherTags)
      .where(eq(otherTags.userId, user))
  const candidates = db
    .select({
      userId: userTagsTable.userId,
      shared: sql<number>`count(*)`.as('shared'),
      total: sql<number>`${tagCount(userTagsTable.userId)}`.as('total'),
    })
    .from(userTagsTable)
    .where(
      and(
        inArray(
          userTagsTable.tagId,
          db
            .select({ tagId: otherTags.tagId })
            .from(otherTags)
            .where(eq(otherTags.userId, userId)),
        ),
        ne(userTagsTable.userId, userId),
        notInArray(
          userTagsTable.userId,
          db
            .select({ id: blockedUsers.blockedUser })
            .from(blockedUsers)
            .where(eq(blockedUsers.userId, userId)),
        ),
        notInArray(
          userTagsTable.userId,
          db
            .select({ id: blockedUsers.userId })
            .from(blockedUsers)
            .where(eq(blockedUsers.blockedUser, userId)),
        ),
      ),
    )
    .groupBy(userTagsTable.userId)
    .as('candidates')
  // Same double as the old `shared / (mine + total - shared)` in JS
  const jaccard = sql<number>`${candidates.shared} * 1.0 / (${tagCount(userId)} + ${candidates.total} - ${candidates.shared})`
  const related = db
    .select({
      userId: candidates.userId,
      shared: candidates.shared,
      jaccard: jaccard.as('jaccard'),
    })
    .from(candidates)
    .orderBy(desc(jaccard), asc(candidates.userId))
    .limit(limit)
    .as('related')

  const rows = await db
    .select({
      shared: related.shared,
      jaccard: related.jaccard,
      user: {
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
      },
    })
    .from(related)
    .innerJoin(userDisplayView, eq(userDisplayView.userId, related.userId))
    // Best match first: the same order the candidates were ranked and cut by (F-38)
    .orderBy(desc(related.jaccard), asc(related.userId))
    .all()

  const finalPayload = rows.map(({ shared, jaccard, user }) => ({
    sharedTags: shared,
    jaccard,
    ...user,
  }))

  // Store the final list (empty lists too)
  await setCachedRelatedUsers(env, userId, limit, finalPayload)

  return finalPayload
}

import type { JJDrizzleDatabase } from '../../../../db/db.ts'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { userTagsTable } from '../../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../../db/schema/views-schema.ts'
import { blockedUsers } from '../../../../db/schema/auth-schema.ts'
import { UserDisplaySchema } from '../../../private/schemas/users.ts'
import { z } from 'zod/v4'

const UserSchema = UserDisplaySchema.extend({
  sharedTags: z.number(),
  jaccard: z.number(),
})

const UserArraySchema = z.array(UserSchema)

type User = z.infer<typeof UserSchema>

// Helper: cache user tag IDs
async function getTagsForUser(db: JJDrizzleDatabase, env: Env, userId: number) {
  const KV = env.KV

  const cachedTagsForUser = await KV.get<{ tagIds: number[] }>(
    `tagsForUser:${userId}`,
    {
      type: 'json',
    }
  )

  if (cachedTagsForUser) {
    const result = cachedTagsForUser.tagIds ?? []
    console.log('getTagsForUser returning (cache hit):', {
      userId,
      tagIds: result,
      cachedTagsForUser,
    })
    return result
  }

  const tagsForUser = await db
    .select({ tagId: userTagsTable.tagId })
    .from(userTagsTable)
    .where(eq(userTagsTable.userId, userId))

  if (tagsForUser.length === 0) {
    console.log('getTagsForUser returning (no tags in DB):', {
      userId,
      tagIds: [],
    })
    return []
  }

  const tagIds = tagsForUser.map((t) => t.tagId)

  await KV.put(`tagsForUser:${userId}`, JSON.stringify({ tagIds }), {
    expirationTtl: 300,
  })

  console.log('getTagsForUser returning (fresh):', { userId, tagIds })
  return tagIds
}

// Helper: cache per-user total tag count (primitive)
async function setUserTagCount(env: Env, userId: number, count: number) {
  const KV = env.KV
  await KV.put(`userTagCount:${userId}`, JSON.stringify({ count }), {
    expirationTtl: 600,
  })
}

// Helper: cache per-user display projection (primitive)
async function setUserDisplay(
  env: Env,
  user: {
    userId: number
    primaryLiveStream: unknown
    role: unknown
    createdAt: unknown
    username: unknown
    profileImage: unknown
    twitchLogin: unknown
    tiltifySlug: unknown
    tiltifyUrl: unknown
    primaryColor: unknown
    accentColor: unknown
  },
) {
  const KV = env.KV
  await KV.put(`userDisplay:${user.userId}`, JSON.stringify(user), {
    expirationTtl: 600,
  })
}

// Helper: cache final related users list (short TTL)
async function getCachedRelatedUsers(env: Env, userId: number, limit: number) {
  const KV = env.KV
  return KV.get<string>(`relatedUsers:${userId}:limit=${limit}`)
}

async function setCachedRelatedUsers(
  env: Env,
  userId: number,
  limit: number,
  data: any,
) {
  const KV = env.KV
  await KV.put(`relatedUsers:${userId}:limit=${limit}`, JSON.stringify(data), {
    expirationTtl: 60,
  })
}

export async function findRelatedUsersWithJaccard(
  db: JJDrizzleDatabase,
  env: Env,
  userId: number,
  limit = 10,
): Promise<User[]> {
  // Try short-lived full-response cache first
  const cached = await getCachedRelatedUsers(env, userId, limit)
  if (cached) {
    const arr: any[] = JSON.parse(cached)
    const arr2 = arr.map((e: any) => {
      return {
        ...e,
        createdAt: new Date(e.createdAt),
      }
    })
    const x = UserArraySchema.parse(arr2)
    console.log('Found cached related users:', x)
    return x
  }

  const tagIds = await getTagsForUser(db, env, userId)

  if (tagIds.length === 0) {
    console.log('findRelatedUsersWithJaccard returning (no tags):', {
      userId,
      limit,
      result: [],
    })
    return []
  }

  const others = await db
    .select({
      userId: userTagsTable.userId,
      tagId: userTagsTable.tagId,
    })
    .from(userTagsTable)
    .where(
      and(
        inArray(userTagsTable.tagId, tagIds),
        ne(userTagsTable.userId, userId),
      ),
    )

  const counts: Record<number, number> = {}
  for (const row of others) {
    counts[row.userId] = (counts[row.userId] || 0) + 1
  }

  // fetch blocked relationships (both directions) and filter out blocked users
  const [blockedByUser, blockedByOthers] = await Promise.all([
    db
      .select({ blockedUserId: blockedUsers.blockedUser })
      .from(blockedUsers)
      .where(eq(blockedUsers.userId, userId)),
    db
      .select({ userId: blockedUsers.userId })
      .from(blockedUsers)
      .where(eq(blockedUsers.blockedUser, userId)),
  ])

  const blockedSet = new Set<number>([
    ...blockedByUser.map((r) => r.blockedUserId),
    ...blockedByOthers.map((r) => r.userId),
  ])

  // remove blocked users from candidate counts
  for (const blockedId of blockedSet) {
    if (blockedId in counts) delete counts[blockedId]
  }

  // get tag counts for each candidate
  const candidateIds = Object.keys(counts).map(Number)

  if (candidateIds.length === 0) {
    console.log('findRelatedUsersWithJaccard returning (no candidates):', {
      userId,
      limit,
      result: [],
    })
    return []
  }

  const candidateTagCounts = await db
    .select({
      userId: userTagsTable.userId,
      tagCount: sql<number>`COUNT(*)`,
    })
    .from(userTagsTable)
    .where(inArray(userTagsTable.userId, candidateIds))
    .groupBy(userTagsTable.userId)

  const tagCountMap = Object.fromEntries(
    candidateTagCounts.map((r) => [r.userId, r.tagCount]),
  )

  // Opportunistically populate per-user tag count cache
  await Promise.allSettled(
    candidateTagCounts.map((r) => setUserTagCount(env, r.userId, r.tagCount)),
  ).catch(() => {})

  const userTagCount = tagIds.length
  const relatedUsers = Object.entries(counts)
    .map(([id, shared]) => {
      const candidateTagCount = tagCountMap[Number(id)] || 1
      const jaccard = shared / (userTagCount + candidateTagCount - shared)
      return {
        userId: Number(id),
        sharedTags: shared,
        jaccard,
      }
    })
    .sort((a, b) => b.jaccard - a.jaccard)
    .slice(0, limit)

  const relatedUsersMap = Object.fromEntries(
    relatedUsers.map((e) => [e.userId, e]),
  )

  const relatedUsersKeys = relatedUsers.map((e) => e.userId)

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
    .where(inArray(userDisplayView.userId, relatedUsersKeys))
    .all()

  // Opportunistically populate per-user display cache
  await Promise.allSettled(results.map((u) => setUserDisplay(env, u))).catch(
    () => {},
  )

  const finalPayload = results.map((user) => {
    return {
      sharedTags: relatedUsersMap[user.userId].sharedTags,
      jaccard: relatedUsersMap[user.userId].jaccard,
      ...user,
    }
  })

  console.log('finalPayload', finalPayload)

  // Store final short-lived cache
  await setCachedRelatedUsers(env, userId, limit, finalPayload)

  return finalPayload
}

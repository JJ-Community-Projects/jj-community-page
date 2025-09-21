import type { JJDrizzleDatabase } from '../../../../db/db.ts'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { userTagsTable } from '../../../../db/schema/tags-schema.ts'
import { userDisplayView } from '../../../../db/schema/views-schema.ts'

// Helper: cache user tag IDs
async function getTagsForUser(db: JJDrizzleDatabase, env: Env, userId: number) {
  const KV = env.KV

  const cachedTagsForUser = await KV.get<{ tagIds: number[] }>(
    `tagsForUser:${userId}`,
  )

  if (cachedTagsForUser) {
    return cachedTagsForUser.tagIds ?? []
  }

  const tagsForUser = await db
    .select({ tagId: userTagsTable.tagId })
    .from(userTagsTable)
    .where(eq(userTagsTable.userId, userId))

  if (tagsForUser.length === 0) return []

  const tagIds = tagsForUser.map((t) => t.tagId)

  await KV.put(`tagsForUser:${userId}`, JSON.stringify({ tagIds }), {
    expirationTtl: 300,
  })

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
  return KV.get<any>(`relatedUsers:${userId}:limit=${limit}`)
}

async function setCachedRelatedUsers(
  env: Env,
  userId: number,
  limit: number,
  data: any,
) {
  const KV = env.KV
  await KV.put(`relatedUsers:${userId}:limit=${limit}`, JSON.stringify(data), {
    expirationTtl: 90,
  })
}

export async function findRelatedUsersWithJaccard(
  db: JJDrizzleDatabase,
  env: Env,
  userId: number,
  limit = 10,
) {
  // Try short-lived full-response cache first
  const cached = await getCachedRelatedUsers(env, userId, limit)
  if (cached) return cached

  const tagIds = await getTagsForUser(db, env, userId)

  if (tagIds.length === 0) return []

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

  // get tag counts for each candidate
  const candidateIds = Object.keys(counts).map(Number)

  if (candidateIds.length === 0) return []

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

  // Store final short-lived cache
  await setCachedRelatedUsers(env, userId, limit, finalPayload)

  return finalPayload
}

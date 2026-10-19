import { implement } from '@orpc/server'
import { count, desc, eq, sql } from 'drizzle-orm'
import { publicTagsContract } from './contract.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'
import { cached } from '../../middleware/cached.ts'
import {
  streamTagsTable,
  tagCategories,
  tags,
  userTagsTable,
} from '../../../db/schema/tags-schema.ts'

const os = implement(publicTagsContract).use(dbMiddleware)

/**
 * The tag catalog: one statement, the per-tag counts aggregated once (not a correlated
 * subquery per tag), edge-cached for everybody (`tagCatalog`).
 */
const catalog = os.catalog
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 1800,
      staleWhileRevalidate: 1800,
    }),
  )
  .use(cached('tagCatalog', () => ''))
  .handler(async ({ context }) => {
    const db = context.db
    const userCounts = db
      .select({ tagId: userTagsTable.tagId, n: count().as('user_n') })
      .from(userTagsTable)
      .groupBy(userTagsTable.tagId)
      .as('user_counts')
    const streamCounts = db
      .select({ tagId: streamTagsTable.tagId, n: count().as('stream_n') })
      .from(streamTagsTable)
      .groupBy(streamTagsTable.tagId)
      .as('stream_counts')
    const userCount = sql<number>`coalesce(${userCounts.n}, 0)`
    const streamCount = sql<number>`coalesce(${streamCounts.n}, 0)`
    const totalUsage = sql<number>`${userCount} + ${streamCount}`

    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        categoryId: tags.categoryId,
        color: tags.color,
        userCount,
        streamCount,
        totalUsage,
        category: {
          id: tagCategories.id,
          slug: tagCategories.slug,
          name: tagCategories.name,
        },
      })
      .from(tags)
      .leftJoin(userCounts, eq(userCounts.tagId, tags.id))
      .leftJoin(streamCounts, eq(streamCounts.tagId, tags.id))
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
      .where(eq(tags.visible, true))
      .orderBy(desc(totalUsage), tags.name)

    return { tags: rows }
  })

export const publicTagsRouter = {
  catalog,
}

import {popularTagsContract} from './contract.ts';
import {implement} from '@orpc/server'
import {dbMiddleware} from "../../../../../middleware/dbMiddleware.ts";
import {userTags} from "../../../../../../db/schema/auth-schema.ts";
import {count, desc} from "drizzle-orm";
import {getTags} from "../../../../../../../functions/getTags.ts";

const os = implement(popularTagsContract)
  .use(dbMiddleware)

const listPopularTags = os.listPopularTagsContract
  .handler(async ({context, input}) => {
    const db = context.db
    const limit = input.limit

    // Get popular tags from database with usage counts
    const popularTags = await db.select({
      tag: userTags.tag,
      label: userTags.label,
      count: count(userTags.tag)
    })
    .from(userTags)
    .groupBy(userTags.tag, userTags.label)
    .orderBy(desc(count(userTags.tag)))
    .limit(limit)
    .all()

    // Get default and charity tags from getTags function
    const { tags: defaultTags, charityTags } = getTags()

    // If we don't have enough popular tags, supplement with default tags
    if (popularTags.length < limit) {
      const existingTags = popularTags.map(t => t.tag)

      // Filter out default tags that are already in popular tags
      const filteredDefaultTags = defaultTags
        .filter(tag => !existingTags.includes(tag.tag))
        .slice(0, limit - popularTags.length)
        .map(tag => ({ ...tag, count: 0 }))

      // Format charity tags with count 0
      const formattedCharityTags = charityTags.map(tag => ({ ...tag, count: 0 }))

      return {
        tags: popularTags,
        defaultTags: filteredDefaultTags,
        charityTags: formattedCharityTags
      }
    }

    // If we have enough popular tags, just return them with empty default/charity arrays
    return {
      tags: popularTags,
      defaultTags: [],
      charityTags: []
    }
  })

export const popularTagsRouter = { listPopularTags }

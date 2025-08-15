import {suggestionsContract} from './contract.ts';
import {implement} from '@orpc/server'
import {dbMiddleware} from "../../../../../middleware/dbMiddleware.ts";
import {userTags} from "../../../../../../db/schema/auth-schema.ts";
import {and, count, desc, eq, like, notInArray} from "drizzle-orm";
import {getTags} from "../../../../../../../functions/getTags.ts";
import {authMiddleware} from "../../../../../middleware/authMiddleware.ts";

const os = implement(suggestionsContract)
  .use(dbMiddleware)

const getSuggestedTagsForUser = os.getSuggestedTagsForUserContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const { limit } = input
    const userId = context.userId

    // Get user's existing tags to filter them out
    const userTagsList = await db.select()
      .from(userTags)
      .where(eq(userTags.userId, userId))
      .all()

    const userTagValues = userTagsList.map(t => t.tag)

    // Get popular tags not used by the user
    let suggestedTags = []
    if (userTagValues.length > 0) {
      suggestedTags = await db.select({
        tag: userTags.tag,
        label: userTags.label,
        count: count(userTags.tag)
      })
      .from(userTags)
      .where(notInArray(userTags.tag, userTagValues))
      .groupBy(userTags.tag, userTags.label)
      .orderBy(desc(count(userTags.tag)))
      .limit(limit)
      .all()
    } else {
      // If user has no tags, get all popular tags
      suggestedTags = await db.select({
        tag: userTags.tag,
        label: userTags.label,
        count: count(userTags.tag)
      })
      .from(userTags)
      .groupBy(userTags.tag, userTags.label)
      .orderBy(desc(count(userTags.tag)))
      .limit(limit)
      .all()
    }

    // Get default and charity tags from getTags function
    const { tags: defaultTags, charityTags } = getTags()

    // Filter default tags that aren't already used by the user
    const filteredDefaultTags = defaultTags
      .filter(tag => !userTagValues.includes(tag.tag))
      .map(tag => ({ ...tag, count: 0 }))

    // Filter charity tags that aren't already used by the user
    const filteredCharityTags = charityTags
      .filter(tag => !userTagValues.includes(tag.tag))
      .map(tag => ({ ...tag, count: 0 }))

    return {
      tags: suggestedTags,
      defaultTags: filteredDefaultTags,
      charityTags: filteredCharityTags
    }
  })

const getSuggestedTagsBySearchTerm = os.getSuggestedTagsBySearchTermContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const { term, limit } = input
    const userId = context.userId
    const searchTermLower = term.toLowerCase()

    // Get user's existing tags to filter them out
    const userTagsList = await db.select()
      .from(userTags)
      .where(eq(userTags.userId, userId))
      .all()

    const userTagValues = userTagsList.map(t => t.tag)
    const { tags: defaultTags, charityTags } = getTags()

    // Filter charity tags that match search term and aren't in user's tags
    const filteredCharityTags = charityTags
      .filter(tag =>
        !userTagValues.includes(tag.tag) &&
        tag.tag.includes(searchTermLower)
      )
      .map(tag => ({ ...tag, count: 0 }))

    // If search term is empty, return only charity tags
    if (term === '') {
      return {
        tags: [],
        defaultTags: [],
        charityTags: filteredCharityTags
      }
    }

    // Get matching tags from database that aren't used by user
    let matchingTags = []
    if (userTagValues.length > 0) {
      matchingTags = await db.select({
        tag: userTags.tag,
        label: userTags.label,
        count: count(userTags.tag)
      })
      .from(userTags)
      .where(and(
        notInArray(userTags.tag, userTagValues),
        like(userTags.tag, `%${term}%`)
      ))
      .groupBy(userTags.tag, userTags.label)
      .orderBy(desc(count(userTags.tag)))
      .limit(limit)
      .all()
    } else {
      // If user has no tags, search all tags
      matchingTags = await db.select({
        tag: userTags.tag,
        label: userTags.label,
        count: count(userTags.tag)
      })
      .from(userTags)
      .where(like(userTags.tag, `%${term}%`))
      .groupBy(userTags.tag, userTags.label)
      .orderBy(desc(count(userTags.tag)))
      .limit(limit)
      .all()
    }

    // Filter default tags that match search term and aren't in user's tags
    const filteredDefaultTags = defaultTags
      .filter(tag =>
        !userTagValues.includes(tag.tag) &&
        tag.tag.includes(searchTermLower)
      )
      .map(tag => ({ ...tag, count: 0 }))

    return {
      tags: matchingTags,
      defaultTags: filteredDefaultTags,
      charityTags: filteredCharityTags
    }
  })

export const suggestionsRouter = { getSuggestedTagsForUser, getSuggestedTagsBySearchTerm }

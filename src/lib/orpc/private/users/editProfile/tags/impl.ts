import {tagsContract} from './contract.ts';
import {implement} from '@orpc/server'
import {dbMiddleware} from "../../../../middleware/dbMiddleware.ts";
import {userTags} from "../../../../../db/schema/auth-schema.ts";
import {authMiddleware} from "../../../../middleware/authMiddleware.ts";
import {and, eq} from "drizzle-orm";
import {suggestionsRouter} from "./suggestions/impl.ts";
import {popularTagsRouter} from "./popular/impl.ts";

const os = implement(tagsContract)
  .use(dbMiddleware)

const addUserTag = os.addUserTagContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const userId = context.userId

    // Insert the tag into the database
    const [result] = await db.insert(userTags).values({
      userId: userId,
      tag: input.tag,
      label: input.label,
    }).returning()

    return {
      userId: result.userId,
      tag: result.tag,
      label: result.label,
      addedAt: result.addedAt
    }
  })

const removeUserTag = os.removeUserTagContract
  .use(authMiddleware)
  .handler(async ({context, input}) => {
    const db = context.db
    const userId = context.userId

    // Delete the tag from the database
    await db.delete(userTags)
      .where(and(
        eq(userTags.userId, userId),
        eq(userTags.tag, input.tag)
      ))

    return {success: true}
  })


/**
 * Get all tags for the authenticated user
 */
const getUserTags = os.getUserTagContract
  .use(authMiddleware)
  .handler(async ({context}) => {
    const db = context.db
    const userId = context.userId
    // Get all tags for the authenticated user
    return db.select()
      .from(userTags)
      .where(eq(userTags.userId, userId))
      .all()
  })

export const tagsRouter = {
  add: addUserTag, remove: removeUserTag, getUserTags,

  find: {
    suggestions: suggestionsRouter,
    popular: popularTagsRouter,
  }
}

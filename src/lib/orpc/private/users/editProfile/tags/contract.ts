import {oc} from '@orpc/contract'
import z from "zod";
import {PaginationLimitSchema, SuccessSchema} from "../../../schemas/common.ts";
import {UserDisplaySchema} from "../../../schemas/users.ts";
import {TagSearchResultSchema, UserTagSchema} from "../../../schemas/tags.ts";


// Input schemas for tag operations
const RemoveUserTagInputSchema = z.object({
  tag: z.string(),
})

const FindUsersByTagInputSchema = z.object({
  tag: z.string(),
  limit: PaginationLimitSchema(),
})

// Tags Contracts
/**
 * Add a tag to a user for categorization and filtering
 */
const addUserTagContract = oc
  .input(
    z.object({
      tag: z.string().min(1),
      label: z.string().min(1),
    })
  )
  .output(
    z.object({
      userId: z.number(),
      tag: z.string(),
      label: z.string(),
      addedAt: z.date(),
    })
  )

/**
 * Remove a tag from a user
 */
const removeUserTagContract = oc
  .input(RemoveUserTagInputSchema)
  .output(SuccessSchema)

/**
 * Get all tags for the authenticated user
 */
const getUserTagsContract = oc
  .input(z.object({}))
  .output(z.array(UserTagSchema))

/**
 * List all available tags with usage counts
 */
const listTagsContract = oc
  .input(z.object({}))
  .output(z.array(TagSearchResultSchema))

/**
 * Find users by a specific tag
 */
const findUsersByTagContract = oc
  .input(FindUsersByTagInputSchema)
  .output(z.array(UserDisplaySchema))

/**
 * Get all tags for the authenticated user
 * Uses authMiddleware to access user ID from context
 */
const getUserTagContract = oc
  .output(UserTagSchema.array())

export const tagsContract = {
  addUserTagContract,
  removeUserTagContract,
  getUserTagsContract,
  listTagsContract,
  findUsersByTagContract,
  getUserTagContract,
}

import {oc} from '@orpc/contract'
import z from "zod";
import {PaginationLimitSchema} from "../../../../schemas/common.ts";
import {SuggestedTagsResponseSchema} from "../../../../schemas/tags.ts";

/**
 * Get suggested tags for a specific user
 */
const getSuggestedTagsForUserContract = oc
  .input(z.object({
    limit: PaginationLimitSchema(1, 50, 5)
  }))
  .output(SuggestedTagsResponseSchema)

/**
 * Get suggested tags for a user filtered by search term
 */
const getSuggestedTagsBySearchTermContract = oc
  .input(z.object({
    term: z.string(),
    limit: PaginationLimitSchema(1, 50, 5)
  }))
  .output(SuggestedTagsResponseSchema)

export const suggestionsContract = {
  getSuggestedTagsForUserContract,
  getSuggestedTagsBySearchTermContract,
}

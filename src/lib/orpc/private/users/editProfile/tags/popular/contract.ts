import {oc} from '@orpc/contract'
import z from "zod";
import {PaginationLimitSchema} from "../../../../schemas/common.ts";
import {PopularTagsResponseSchema} from "../../../../schemas/tags.ts";

/**
 * Get popular tags with optional limit
 */
const listPopularTagsContract = oc
  .input(z.object({
    limit: PaginationLimitSchema(1, 50, 5)
  }))
  .output(PopularTagsResponseSchema)

export const popularTagsContract = {
  listPopularTagsContract,
}

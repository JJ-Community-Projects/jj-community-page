import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

const CatalogTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  color: z.string(),
  userCount: z.number(),
  streamCount: z.number(),
  totalUsage: z.number(),
  category: z
    .object({
      id: z.number(),
      slug: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export type CatalogTag = z.infer<typeof CatalogTagSchema>

/**
 * Every visible tag with its usage counts and category, most used first (then by name).
 * The tag pickers search and rank this list in the browser (`src/lib/tagCatalog.ts`).
 */
const catalogContract = oc
  .output(z.object({ tags: z.array(CatalogTagSchema) }))
  .route({
    path: '/tags/catalog',
    method: 'GET',
    operationId: 'getTagCatalog',
    summary: 'Tag catalog',
    description:
      'All visible tags with user and stream usage counts and their category, ordered by total usage, then name.',
    tags: ['tags'],
  })

export const publicTagsContract = {
  catalog: catalogContract,
}

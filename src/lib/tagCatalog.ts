import type { CatalogTag } from './orpc/public/tags/contract.ts'

export type { CatalogTag }

// The catalog comes ordered by total usage, then name, so both helpers keep its order.

/** Tags used by at least one user or stream: what `private.tags.getPopularTags` returned. */
export function popularTags(catalog: CatalogTag[], limit: number) {
  return catalog.filter((t) => t.totalUsage > 0).slice(0, limit)
}

/**
 * Tags whose name, slug, description or category name contains `query` (case-insensitive):
 * what `private.tags.fullTagsSearch` returned, used or not.
 */
export function searchTags(
  catalog: CatalogTag[],
  query: string,
  limit: number,
) {
  const q = query.toLowerCase()
  const has = (text: string | null | undefined) =>
    text != null && text.toLowerCase().includes(q)
  return catalog
    .filter(
      (t) =>
        has(t.name) ||
        has(t.slug) ||
        has(t.description) ||
        has(t.category?.name),
    )
    .slice(0, limit)
}

import { ORPCError } from '@orpc/server'

/**
 * True when a public page's lookup failed because the entity doesn't exist for this visitor: unknown
 * or invalid slug, or hidden (private) content. Pages answer these with the 404 page, so a private
 * team or schedule looks the same as a missing one.
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof ORPCError &&
    ['NOT_FOUND', 'BAD_REQUEST', 'FORBIDDEN', 'UNAUTHORIZED'].includes(
      error.code,
    )
  )
}

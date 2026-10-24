/** Canonical origin. Canonicals always point at prod, also on beta and in dev. */
export const SITE_URL = 'https://jinglejam.ostof.dev'

/** Absolute canonical URL for a path or URL: prod host, no query string, no trailing slash. */
export function canonicalUrl(url: URL | string): string {
  const pathname = typeof url === 'string' ? url : url.pathname
  return `${SITE_URL}${pathname.replace(/\/+$/, '')}`
}

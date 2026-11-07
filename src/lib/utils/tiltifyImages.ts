const TILTIFY_UPLOADS = 'https://assets.tiltify.com/uploads/'

/**
 * Tiltify only serves the full upload (400x400, often 100 kB+). Cloudflare Image Transformations
 * resize it to 80x80 (40px tiles at 2x) on the same zone; `assets.tiltify.com` must be an allowed
 * source in the dashboard (Images → Transformations → Sources). Tiltify's default avatar lives
 * under `/assets/` and stays as it is.
 */
export function tiltifyThumbnail<T extends string | null | undefined>(url: T): T {
  if (!url?.startsWith(TILTIFY_UPLOADS)) return url
  return `/cdn-cgi/image/width=80,height=80,fit=cover,format=auto/${url}` as T
}

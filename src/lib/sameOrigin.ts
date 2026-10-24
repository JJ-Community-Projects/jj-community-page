/**
 * `/api/private` only answers our own pages. Browsers send `Origin` on every POST and every
 * WebSocket upgrade, same-origin included, so a missing, `null` or foreign `Origin` is refused.
 * Server-rendered calls go in-process (`serverClientPrivate`) and never get here.
 *
 * Returns the 403 to send, or null when the request may go on.
 */
export function rejectCrossOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin')
  if (origin !== null && origin === new URL(request.url).origin) return null
  return new Response(origin === null ? 'Missing Origin' : 'Cross-origin request', {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

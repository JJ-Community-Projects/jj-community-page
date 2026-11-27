/**
 * Counts overlay page loads (OBS browser sources) per overlay and streamer in Workers Analytics
 * Engine. One data point per successful GET of `/overlays/<name>`:
 *
 * - index1: overlay name
 * - blob1: overlay name, blob2: `user` param (Tiltify slug), blob3: `team` / `teamId` param,
 *   blob4: client (obs | streamlabs | meld | xsplit | iframe | browser), blob5: `theme`, blob6: `demo`
 * - double1: 1
 *
 * No IP, cookie or session data is stored. Read back with the Analytics Engine SQL API.
 */

const OVERLAY_PATH = /^\/overlays\/([a-z0-9-]+)\/?$/;
const MAX_PARAM = 100;

export type OverlayClient = 'obs' | 'streamlabs' | 'meld' | 'xsplit' | 'iframe' | 'browser';

export function overlayClient(headers: Headers): OverlayClient {
  const ua = (headers.get('user-agent') ?? '').toLowerCase();
  // Streamlabs Desktop is built on OBS and reports "OBS/<version> SLD".
  if (ua.includes(' sld') || ua.includes('streamlabs')) return 'streamlabs';
  if (ua.includes('obs/')) return 'obs';
  if (ua.includes('meld/')) return 'meld';
  if (ua.includes('xsplit')) return 'xsplit';
  // Dashboard previews and other embeds; OBS loads the page as a top-level document.
  if (headers.get('sec-fetch-dest') === 'iframe') return 'iframe';
  return 'browser';
}

function param(params: URLSearchParams, ...names: string[]): string {
  for (const name of names) {
    const value = params.get(name);
    if (value) return value.slice(0, MAX_PARAM);
  }
  return '';
}

/** The data point for a request, or null when it isn't an overlay page load. */
export function overlayHitFrom(request: Request): AnalyticsEngineDataPoint | null {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  const match = OVERLAY_PATH.exec(url.pathname);
  if (!match) return null;
  const overlay = match[1];
  const params = url.searchParams;
  return {
    indexes: [overlay],
    blobs: [
      overlay,
      param(params, 'user'),
      param(params, 'team', 'teamId'),
      overlayClient(request.headers),
      param(params, 'theme'),
      param(params, 'demo'),
    ],
    doubles: [1],
  };
}

/** Records the load if the request was an overlay page that rendered. Never throws. */
export function recordOverlayHit(
  dataset: AnalyticsEngineDataset | undefined,
  request: Request,
  status: number,
): void {
  if (!dataset || status !== 200) return;
  try {
    const point = overlayHitFrom(request);
    if (point) dataset.writeDataPoint(point);
  } catch (e) {
    console.error('overlayHits', e instanceof Error ? e.message : String(e));
  }
}

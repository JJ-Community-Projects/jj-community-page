// Static slug/login maps and Twitch/YouTube URL helpers shared across the
// JingleJamData feature modules. Pure functions — no Durable Object state.

export const replaceMap: Map<string, string> = new Map([
  ['crustydoggo', 'kirsty'],
  ['bobawitch', 'boba'],
  ['boba_witch', 'boba'],
])

export const tiltifySlugToTwitchLoginMap: Map<string, string> = new Map([
  ['hrry', 'hrry'],
  ['rtgamecrowd', 'rtgame'],
  ['bobawitch', 'boba'],
  ['crustydoggo', 'kirsty'],
  ['inthelittlewood', 'inthelittlewood'],
  ['ravs', 'ravs_'],
  ['sips-yogscast', 'sips_'],
  ['pedguin', 'pedguin'],
  ['highrollersdnd', 'highrollersdnd'],
  ['jackmanifoldtv', 'jackmanifoldtv'],
  ['mudkipninja', 'mudkipninja'],
  ['fionn', 'fionn'],
])

export function normalizeTwitchLogin(
  input: string | undefined | null,
): string {
  if (!input) return ''
  let s = String(input).trim().toLowerCase()
  // Remove protocol and domain prefixes
  s = s.replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '')
  s = s.replace(/^(www\.)?twitch\.tv\//i, '')
  // Take only the first path segment, drop query/fragment
  s = s.split(/[\/?#]/)[0]
  if (replaceMap.has(s)) {
    s = replaceMap.get(s) ?? ''
  }
  return s
}

// Fully-qualified Twitch URL from any incoming channel value
export function toTwitchUrl(
  input: string | null | undefined,
): string | undefined {
  if (!input) return undefined
  const login = normalizeTwitchLogin(String(input).toLowerCase())
  return login ? `https://twitch.tv/${login}` : undefined
}

// Fully-qualified YouTube URL from any incoming value (channel/video URL, id, or handle).
// Automatically detects whether the input represents a video, channel, or handle.
export function toYouTubeUrl(
  input: string | null | undefined,
): string | undefined {
  if (!input) return undefined
  let s = String(input).trim()
  if (!s) return undefined

  // If it's already a URL, normalize common short links and otherwise return as-is
  if (/^https?:\/\//i.test(s)) {
    try {
      const url = new URL(s)
      const host = url.hostname.toLowerCase()
      const path = url.pathname
      if (host === 'youtu.be') {
        // Short link: https://youtu.be/<videoId>
        const id = path.replace(/^\//, '').split('/')[0]
        if (/^[a-zA-Z0-9_-]{11}$/.test(id))
          return `https://www.youtube.com/watch?v=${id}`
      }
      // For other youtube.com URLs, return as-is
      return s
    } catch {
      // fall-through to ID/handle detection if URL parsing fails
    }
  }

  // Detect a YouTube video id (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) {
    return `https://www.youtube.com/watch?v=${s}`
  }

  // Detect a channel id starting with UC and length 24 (UC + 22)
  if (/^UC[a-zA-Z0-9_-]{22}$/i.test(s)) {
    return `https://www.youtube.com/channel/${s}`
  }

  // Detect a handle (with @) or treat as handle if not having @ but looks like a name
  if (s.startsWith('@')) return `https://www.youtube.com/${s}`
  // As a sane default, treat as a handle-style channel name
  return `https://www.youtube.com/@${s}`
}

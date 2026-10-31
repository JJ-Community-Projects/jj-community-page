import { socialUrlRegex } from './socialUrlRegex.ts'

export type SocialUrlProvider = keyof ReturnType<typeof socialUrlRegex>

// Hosts people paste that the regexes don't know: `www.`, and the mobile sites
const hostPrefix = /^(www|m|mobile)\./

/** A bare username (with or without `@`) as the profile URL; the regex decides if it's valid. */
function usernameUrl(provider: SocialUrlProvider, name: string): string {
  switch (provider) {
    case 'twitch':
      return `https://twitch.tv/${name}`
    case 'twitter':
      return `https://x.com/${name}`
    case 'youtube':
      // Channel IDs are `UC` + 22 characters; anything else is a handle
      return /^UC[\w-]{22}$/.test(name)
        ? `https://youtube.com/channel/${name}`
        : `https://youtube.com/@${name}`
    case 'bsky':
      // Every Bluesky handle is a domain; a bare name is one on the default bsky.social
      return `https://bsky.app/profile/${name.includes('.') ? name : `${name}.bsky.social`}`
    case 'instagram':
      return `https://instagram.com/${name}`
    case 'tiktok':
      return `https://tiktok.com/@${name}`
  }
}

/**
 * What the user typed in a social field as the URL to store, or undefined when it isn't a valid
 * link for the provider. Takes a profile URL (with or without `https://` and `www.`) or a bare
 * username (with or without `@`). Input with a `/` or a scheme is a URL: usernames on Instagram and
 * Bluesky can contain dots, so a dot alone doesn't make one.
 */
export function toSocialUrl(
  provider: SocialUrlProvider,
  input: string,
): string | undefined {
  const value = input.trim()
  if (!value) return undefined

  let candidate: string
  if (/^https?:\/\//i.test(value) || value.includes('/')) {
    let url: URL
    try {
      url = new URL(`https://${value.replace(/^https?:\/\//i, '')}`)
    } catch {
      return undefined
    }
    // Query and hash are share tracking (`?si=`, `?igsh=`), not part of the profile
    const path = url.pathname.replace(/\/+$/, '')
    candidate = `https://${url.hostname.replace(hostPrefix, '')}${path}`
  } else {
    candidate = usernameUrl(provider, value.replace(/^@/, ''))
  }

  return socialUrlRegex()[provider].test(candidate) ? candidate : undefined
}

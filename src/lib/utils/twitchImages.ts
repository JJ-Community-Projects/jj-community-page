// Twitch serves every profile image in several sizes; the Helix API and our content hand out 300x300.
// Small avatars only need 70x70, so swap the size in Twitch CDN URLs and leave every other URL alone.
export function twitchThumbnail<T extends string | null | undefined>(url: T): T {
  if (!url?.startsWith('https://static-cdn.jtvnw.net/')) return url
  return url.replace('-profile_image-300x300.', '-profile_image-70x70.') as T
}

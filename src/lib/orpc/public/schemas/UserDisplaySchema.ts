import z from 'zod/v4'

/**
 * Schema for user display information used in public API responses.
 * Contains essential user data for profile cards, user lists, and public displays.
 * Combines data from users, accounts, and userStyles tables.
 * Used in: public user lookups, friend lists, team member displays
 */
export const UserDisplaySchema = z.object({
  /** Unique identifier from the users table */
  userId: z.number(),
  /** Primary streaming platform preference (twitch, youtube, tiktok) */
  primaryLiveStream: z.string(),
  /** Account creation timestamp */
  createdAt: z.date(),
  /** Display name, typically from the primary streaming platform */
  username: z.string(),
  /** Profile image URL from the streaming platform */
  profileImage: z.string(),
  /** Twitch login username, null if no Twitch account linked */
  twitchLogin: z.string().nullable(),
  /** Tiltify fundraising profile slug */
  tiltifySlug: z.string(),
  /** Full Tiltify profile URL for fundraising campaigns */
  tiltifyUrl: z.string(),
  /** Custom primary brand color from userStyles table */
  primaryColor: z.string().nullable(),
  /** Custom accent color from userStyles table */
  accentColor: z.string().nullable(),
});

export type UserDisplay = z.infer<typeof UserDisplaySchema>

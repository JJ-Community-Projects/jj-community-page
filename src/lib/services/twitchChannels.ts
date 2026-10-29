import { eq } from 'drizzle-orm'
import type { JJDrizzleDatabase } from '../db/db.ts'
import { twitchChannelSchema } from '../db/schema/twitch-channel-schema.ts'
import type { TwitchUser } from '../model/TwitchAPIModel.ts'

/**
 * Stores `channel` as `userId`'s Twitch channel, or refreshes its profile when it already is.
 * A channel linked to another account stays with that account (F-12): linking goes by a typed
 * login or the Tiltify profile's Twitch link, neither proves ownership. One round trip.
 *
 * @returns `'linked'`, or `'taken'` when another account has the channel (nothing written)
 */
export async function linkTwitchChannel(
  db: JJDrizzleDatabase,
  userId: number,
  channel: TwitchUser,
): Promise<'linked' | 'taken'> {
  const profile = {
    login: channel.login,
    displayName: channel.display_name,
    description: channel.description,
    profileImageUrl: channel.profile_image_url,
    offlineImageUrl: channel.offline_image_url,
  }
  // The update runs only for the same owner, so a taken channel returns no row
  const rows = await db
    .insert(twitchChannelSchema)
    .values({ userId, id: channel.id, ...profile })
    .onConflictDoUpdate({
      target: [twitchChannelSchema.id],
      set: profile,
      setWhere: eq(twitchChannelSchema.userId, userId),
    })
    .returning({ id: twitchChannelSchema.id })
  return rows.length > 0 ? 'linked' : 'taken'
}

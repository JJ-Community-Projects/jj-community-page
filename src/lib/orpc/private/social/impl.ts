import { platformsContract } from './contract.ts'
import { implement, ORPCError } from '@orpc/server'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { authMiddleware } from '../../middleware/authMiddleware.ts'
import { and, eq } from 'drizzle-orm'
import { TwitchAPI } from '../../../twitchAPI.ts'
import { twitchChannelSchema, twitchStreamSchema, } from '../../../db/schema/twitch-channel-schema.ts'
import { userSocials } from '../../../db/schema/auth-schema.ts'
import { TiltifyAPI } from '../../../TiltifyAPI.ts'
import { loggableError } from '../../../db/loggableError.ts'
import { linkTwitchChannel } from '../../../services/twitchChannels.ts'

const os = implement(platformsContract).use(dbMiddleware)

const addSocial = os.addSocialContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId

    try {
      if (input.provider === 'twitch') {
        const twitchAPI = new TwitchAPI(context.env)

        // Extract username from Twitch URL
        const components = input.url.split('/')
        const username = components[components.length - 1]

        // Fetch channel data from Twitch API
        const { data, error } = await twitchAPI.fetchUserByLogin(username)

        if (error) {
          throw new ORPCError('NOT_FOUND', {
            message: `Failed to fetch Twitch channel: ${error.description}`,
          })
        }

        if (!data || data.length === 0) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Twitch channel not found',
          })
        }

        if ((await linkTwitchChannel(db, userId, data[0])) === 'taken') {
          throw new ORPCError('CONFLICT', {
            message: 'This Twitch channel is linked to another account',
          })
        }
      }

      // Insert or update the social media link in the database
      const [result] = await db
        .insert(userSocials)
        .values({
          userId: userId,
          provider: input.provider,
          url: input.url,
        })
        .onConflictDoUpdate({
          target: [userSocials.userId, userSocials.provider],
          set: { url: input.url },
        })
        .returning()

      return result
    } catch (e) {
      // NOT_FOUND / CONFLICT above are for the caller
      if (e instanceof ORPCError) throw e
      console.error(loggableError(e)) // F-32
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `Failed to add social`,
      })
    }
  })

const removeSocial = os.removeSocialContract
  .use(authMiddleware)
  .handler(async ({ context, input }) => {
    const db = context.db
    const userId = context.userId

    // Delete the social media link from the database
    const [result] = await db
      .delete(userSocials)
      .where(
        and(
          eq(userSocials.userId, userId),
          eq(userSocials.provider, input.provider),
        ),
      )
      .returning()
    if (!result) {
      throw new ORPCError('NOT_FOUND', { message: 'Social link not found' })
    }
    if (input.provider === 'twitch') {
      const [channel] = await db
        .delete(twitchChannelSchema)
        .where(eq(twitchChannelSchema.userId, userId))
        .returning()
      // Rows from before F-12 can have a Twitch social whose channel stayed with another user
      if (channel) {
        await db
          .delete(twitchStreamSchema)
          .where(eq(twitchStreamSchema.twitchId, channel.id))
      }
    }

    return result
  })

/**
 * Get all social media links for the authenticated user
 */
const getSocial = os.getSocialContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db
    const userId = context.userId

    // Get all social media links for the authenticated user
    return db
      .select()
      .from(userSocials)
      .where(eq(userSocials.userId, userId))
      .all()
  })

// Helper function to format social URLs based on platform
function formatSocialUrl(platform: string, value: string): string {
  if (value.startsWith('http')) {
    return value
  }

  switch (platform) {
    case 'twitch':
      return `https://twitch.tv/${value}`
    case 'twitter':
      return `https://twitter.com/${value}`
    case 'youtube':
      // Check if it's a channel ID or username
      if (value.startsWith('UC')) {
        return `https://youtube.com/channel/${value}`
      } else {
        return `https://youtube.com/@${value}`
      }
    case 'instagram':
      return `https://instagram.com/${value}`
    case 'tiktok':
      return `https://tiktok.com/@${value}`
    default:
      return value
  }
}

const importFromTiltify = os.importFromTiltifyContract
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const db = context.db
    const userId = context.userId

    // Get Tiltify API instance
    const tiltifyAPI = new TiltifyAPI(context.env)

    // Get user's Tiltify token
    let tiltifyToken: string | null
    try {
      tiltifyToken = await tiltifyAPI.getTokenFromLocals(context.locals)
      if (!tiltifyToken) {
        throw new ORPCError('UNAUTHORIZED', {
          message: 'No Tiltify token found for user',
        })
      }
    } catch (error) {
      console.error('Error getting Tiltify token:', loggableError(error)) // F-32
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get Tiltify token',
      })
    }

    // Get Tiltify user data
    let tiltifyUser
    try {
      tiltifyUser = await tiltifyAPI.getUser(tiltifyToken)
    } catch (error) {
      console.error('Error getting Tiltify user data:', loggableError(error)) // F-32
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get Tiltify user data',
      })
    }

    if (!tiltifyUser) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to get Tiltify user data',
      })
    }

    // Process social media links
    const socials = tiltifyUser.data.social
    const results: { provider: string; success: boolean }[] = []

    // Handle each social platform (twitch, twitter, youtube, instagram, tiktok)
    const socialPlatforms = [
      { platform: 'twitch', value: socials.twitch },
      { platform: 'twitter', value: socials.twitter },
      { platform: 'youtube', value: socials.youtube },
      { platform: 'instagram', value: socials.instagram },
      { platform: 'tiktok', value: socials.tiktok },
    ]

    for (const { platform, value } of socialPlatforms) {
      if (value) {
        try {
          const url = formatSocialUrl(platform, value)

          if (platform === 'twitch') {
            const twitchAPI = new TwitchAPI(context.env)

            // Extract username from Twitch URL
            const components = url.split('/')
            const username = components[components.length - 1]

            // Fetch channel data from Twitch API
            const { data, error } = await twitchAPI.fetchUserByLogin(username)

            if (error) {
              throw new ORPCError('NOT_FOUND', {
                message: `Failed to fetch Twitch channel: ${error.description}`,
              })
            }

            if (!data || data.length === 0) {
              throw new ORPCError('NOT_FOUND', {
                message: 'Twitch channel not found',
              })
            }

            // Another account's channel: not imported, and no Twitch social without it (F-12)
            if ((await linkTwitchChannel(db, userId, data[0])) === 'taken') {
              results.push({ provider: platform, success: false })
              continue
            }
          }

          try {
            await db
              .insert(userSocials)
              .values({
                userId,
                provider: platform,
                url,
              })
              .onConflictDoUpdate({
                target: [userSocials.userId, userSocials.provider],
                set: { url },
              })
          } catch (e) {
            console.error(
              'userSocials',
              {
                userId,
                provider: platform,
                url,
              },
              loggableError(e), // F-32
            )
            throw e
          }

          results.push({ provider: platform, success: true })
        } catch (error) {
          console.error(`Error adding ${platform} social:`, loggableError(error)) // F-32
          results.push({ provider: platform, success: false })
        }
      }
    }

    return results
  })

export const socialRouter = {
  addSocial,
  removeSocial,
  importFromTiltify,
  getSocial,
}

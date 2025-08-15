import {implement, ORPCError} from '@orpc/server'
import {twitchContract} from './contract.ts'
import {authMiddleware} from '../../../middleware/authMiddleware.ts'
import {twitchChannelSchema} from "../../../../db/schema/twitch-channel-schema.ts";
import {eq} from "drizzle-orm";
import {dbMiddleware} from "../../../middleware/dbMiddleware.ts";

const os = implement(twitchContract)
  .use(authMiddleware)

const validateTwitchUrl = os.validateTwitchUrl
  .handler(async ({input: url, context}) => {
    const userId = context.userId.toString()

    const DO = context.ctx.locals.runtime.env.TwitchAPIDO
    const DO_ID = DO.idFromName(userId)
    const stub = DO.get(DO_ID)

    if (!stub) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'TwitchAPI Durable Object not available'})
    }

    const components = url.split('/')
    const name = components[components.length - 1]

    const {data, error} = await stub.fetchUserByLogin(name)

    if (error) {
      throw new ORPCError('BAD_REQUEST', {message: error.description})
    }

    if (data.data.length === 0) {
      throw new ORPCError('NOT_FOUND', {message: 'Twitch user not found'})
    }

    return data.data[0]
  })


const getTwitchChannel = os.getTwitchChannelContract
  .use(dbMiddleware)
  .use(authMiddleware)
  .handler(async ({context}) => {
    const userId = context.userId
    const db = context.db

    // Query Twitch channel data by user ID
    const twitchChannel = await db.select({
      userId: twitchChannelSchema.userId,
      id: twitchChannelSchema.id,
      login: twitchChannelSchema.login,
      displayName: twitchChannelSchema.displayName,
      description: twitchChannelSchema.description,
      profileImageUrl: twitchChannelSchema.profileImageUrl,
      offlineImageUrl: twitchChannelSchema.offlineImageUrl,
    })
      .from(twitchChannelSchema)
      .where(eq(twitchChannelSchema.userId, userId))
      .get();

    // Return null if no Twitch channel is found for the user
    return twitchChannel || null;
  })


export const twitchImpl = {validateTwitchUrl, getTwitchChannel}

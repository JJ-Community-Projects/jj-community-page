import { getDB } from '../lib/db/db.ts'
import { TwitchLiveCheckQueue } from '../queues/TwitchLiveCheckQueue.ts'
import { twitchChannelSchema } from '../lib/db/schema/twitch-channel-schema.ts'

export async function scheduledTwitch(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  console.log('scheduledTwitch')
  const db = getDB(env)
  // Get all Twitch channels
  const twitchChannels = await db.select().from(twitchChannelSchema).all()

  // Extract channel IDs
  const ids = twitchChannels.map((channel) => channel.id)

  const queue = new TwitchLiveCheckQueue()
  await queue.send(ids, env)

  const DO = env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  await stub.checkLiveStreams()
}

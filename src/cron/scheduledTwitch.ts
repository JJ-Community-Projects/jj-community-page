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

  const DO = env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)

  const dbLogins = twitchChannels.map((channel) => channel.login)
  const validLogins = await stub.getValidTwitchLogins()

  const logins = [...dbLogins, ...validLogins]

  const uniqueLogins = [...new Set(logins)]
  const queue = new TwitchLiveCheckQueue()
  await queue.sendLogins(uniqueLogins, env)
}

import {getDB} from "../lib/db/db.ts";
import {TwitchRepo} from "../lib/db/repos/TwitchRepo.ts";
import {TwitchLiveCheckQueue} from "../queues/TwitchLiveCheckQueue.ts";

export async function scheduledTwitch(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
) {
  console.log('scheduledTwitch')
  const db = getDB(env)
  const twitchRepo = new TwitchRepo(db, 'cron');

  // Get all Twitch channels
  const twitchChannels = await twitchRepo.getAllChannels();

  // Extract channel IDs
  const ids = twitchChannels.map((channel) => channel.id)

  const queue = new TwitchLiveCheckQueue()
  await queue.send(ids, env)
}

import astroWorker from '../dist/_worker.js/index.js'
import { scheduled } from './cron/scheduled.js'
import { TwitchLiveNotifierQueue } from './queues/TwitchLiveNotifierQueue.js'
import { TwitchLiveCheckQueue } from './queues/TwitchLiveCheckQueue.js'
// Export the main worker with a fetch handler.
// Requests that aren’t meant for your Durable Object will be handled by the Astro worker.
export default {
  async fetch(request, env, ctx) {
    // console.log("fetch", request.url);
    return astroWorker.fetch(request, env, ctx)
  },
  async queue(batch, env, ctx) {
    const twitchLiveCheckQueue = new TwitchLiveCheckQueue()
    const notifier = new TwitchLiveNotifierQueue()
    switch (batch.queue) {
      case 'twitch-live-notifier':
        await notifier.handle(batch, env, ctx)
        break
      case 'twitch-live-check':
        await twitchLiveCheckQueue.handle(batch, env, ctx)
        break
      case 'twitch-live-check-prod':
        await twitchLiveCheckQueue.handle(batch, env, ctx)
        break
      case 'youtube-live-check':
        // await handleB(batch.messages);
        break
    }
  },
}

export { JingleJamData } from './do/JingleJamData.ts'
export { UserRateLimiter } from './do/rateLimiter/UserRateLimiter.ts'

export { FriendRequestIncomingObject } from './lib/orpc/private/friendsWS/do/FriendRequestIncomingObject.ts'
export { FriendRequestSentObject } from './lib/orpc/private/friendsWS/do/FriendRequestSentObject.ts'
export { FriendsListObject } from './lib/orpc/private/friendsWS/do/FriendsListObject.ts'

export { UserTeamInvitesObject } from './lib/orpc/private/teamsWS/do/UserTeamInvitesObject.ts'
export { UserTeamsObject } from './lib/orpc/private/teamsWS/do/UserTeamsObject.ts'
export { TeamAdminInvitesObject } from './lib/orpc/private/teamsWS/do/TeamAdminInvitesObject.ts'
export { TeamAdminMembersObject } from './lib/orpc/private/teamsWS/do/TeamAdminMembersObject.ts'

export { ScheduleEditingObject } from './lib/orpc/private/scheduleEditingWS/do/ScheduleEditingObject.ts'

export { ConfigDO } from './do/ConfigDO.ts'
export { TwitchExtensionRateLimiter } from './do/rateLimiter/TwitchExtensionRateLimiter.ts'

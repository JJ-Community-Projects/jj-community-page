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
  async scheduled(controller, env, ctx) {
    return scheduled(controller, env, ctx)
  },
  async queue(batch, env, ctx) {
    switch (batch.queue) {
      case 'TWITCH_LIVE_NOTIFIER':
        const notifier = new TwitchLiveNotifierQueue()
        await notifier.handle(batch, env, ctx)
        break
      case 'TWITCH_LIVE_CHECK':
        const twitchLiveCheck = new TwitchLiveCheckQueue()
        await twitchLiveCheck.handle(batch, env, ctx)
        break
      case 'YOUTUBE_LIVE_CHECK':
        // await handleB(batch.messages);
        break
    }
  },
}

export { ScheduleEditorDO } from './do/ScheduleEditorDO.js'
export { JingleJamData } from './do/JingleJamData.js'
export { UserRateLimiter } from './do/rateLimiter/UserRateLimiter.js'

export { FriendRequestIncomingObject } from './lib/orpc/private/friendsWS/do/FriendRequestIncomingObject.ts'
export { FriendRequestSentObject } from './lib/orpc/private/friendsWS/do/FriendRequestSentObject.ts'
export { FriendsListObject } from './lib/orpc/private/friendsWS/do/FriendsListObject.ts'

export { UserTeamInvitesObject } from './lib/orpc/private/teamsWS/do/UserTeamInvitesObject.ts'
export { UserTeamsObject } from './lib/orpc/private/teamsWS/do/UserTeamsObject.ts'
export { TeamAdminInvitesObject } from './lib/orpc/private/teamsWS/do/TeamAdminInvitesObject.ts'
export { TeamAdminMembersObject } from './lib/orpc/private/teamsWS/do/TeamAdminMembersObject.ts'
export { ScheduleEditingObject } from './lib/orpc/private/scheduleEditingWS/do/ScheduleEditingObject.ts'


export {ConfigDO} from './do/ConfigDO.js'

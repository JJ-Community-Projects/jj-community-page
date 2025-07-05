import astroWorker from "../dist/_worker.js/index.js";
import {scheduled} from "./cron/scheduled.js";
// Export the main worker with a fetch handler.
// Requests that aren’t meant for your Durable Object will be handled by the Astro worker.
export default {
    async fetch(request, env, ctx) {
        // console.log("fetch", request.url);
        return astroWorker.fetch(request, env, ctx);
    },
    async scheduled(controller, env, ctx) {
        return scheduled(controller, env, ctx);
    },
    async queue(batch, env, ctx) {
        switch (batch.queue) {
            case 'TWITCH_LIVE_CHECK':
                const twitchLiveCheck = new TwitchLiveCheckQueue()
                await twitchLiveCheck.handle(batch, env, ctx);
                break;
            case 'YOUTUBE_LIVE_CHECK':
                // await handleB(batch.messages);
                break;
        }
    }
};

export { ScheduleEditorDO } from "./do/ScheduleEditorDO.js";
export { JingleJamData } from "./do/JingleJamData.js";
export { UserDO } from "./do/UserDO.js";
export { TeamDO } from "./do/TeamDO.js";
export { UserRateLimiter } from "./do/rateLimiter/UserRateLimiter.js";
export { TwitchAPIDO } from "./do/TwitchAPIDO.js";

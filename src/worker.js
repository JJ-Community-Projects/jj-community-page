import astroWorker from "../dist/_worker.js/index.js";
// Export the main worker with a fetch handler.
// Requests that aren’t meant for your Durable Object will be handled by the Astro worker.
export default {
    async fetch(request, env, ctx) {
        // console.log("fetch", request.url);
        return astroWorker.fetch(request, env, ctx);
    },
};

export { ScheduleEditorDO } from "./do/ScheduleEditorDO.js";
export { JingleJamData } from "./do/JingleJamData.js";
export { UserDO } from "./do/UserDO.js";
export { TeamDO } from "./do/TeamDO.js";
export { UserRateLimiter } from "./do/rateLimiter/UserRateLimiter.js";

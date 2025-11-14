import { scheduledTwitch } from './scheduledTwitch.ts'
import { scheduledYogsJJAP } from './scheduledYogsJJAPI.ts'

export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  switch (controller.cron) {
    case '*/10 * * * *':
      await scheduledTwitch(controller, env, ctx)
      break
    case '*/1 * 1-15 12 *':
      await scheduledYogsJJAP(controller, env, ctx)
      break
    case '0 */2 * * *':
      const DO = env.JingleJamData
      const stubID = DO.idFromName('JJ_API_CACHE')
      const stub = DO.get(stubID)
      try {
        await stub.fetchGBPToEURConversionRate()
      } catch (e) {
        console.error(e)
      }
      try {
        await stub.loadAllTiltifySocials()
      } catch (e) {
        console.error(e)
      }
      try {
        await stub.validateTwitchChannels()
      } catch (e) {
        console.error(e)
      }
      try {
        await stub.buildAndStoreUserTags()
      } catch (e) {
        console.error(e)
      }
      break
  }
}

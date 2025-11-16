import { scheduledTwitch } from './scheduledTwitch.ts'
import { scheduledYogsJJAP } from './scheduledYogsJJAPI.ts'
import { DateTime } from 'luxon'

export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  switch (controller.cron) {
    case '*/10 * * * *':
      await scheduledTwitch(controller, env, ctx)
      break
    case '*/1 * * * *':
      const date = DateTime.now().setZone('Europe/London')
      const isJJ = date.month === 12 && date.day >= 1 && date.day <= 15
      if (isJJ) {
        await scheduledYogsJJAP(controller, env, ctx)
      } else {
        const DO = env.JingleJamData
        const stubID = DO.idFromName('JJ_API_CACHE')
        const stub = DO.get(stubID)
        try {
          await stub.buildDisplayData()
          console.log('scheduled', 'buildDisplayData')
        } catch (e) {
          console.error(e)
        }
      }
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

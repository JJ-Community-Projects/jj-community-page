import { scheduledTwitch } from './scheduledTwitch.ts'
import { scheduledYogsJJAP } from './scheduledYogsJJAPI.ts'

export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  switch (controller.cron) {
    case '*/5 * * * *':
      await scheduledTwitch(controller, env, ctx)
      break
    case '*/1 * 1-15 12 *':
      await scheduledYogsJJAP(controller, env, ctx)
      break
    case '0 */1 * * *':
      const DO = env.JingleJamData
      const stubID = DO.idFromName('JJ_API_CACHE')
      const stub = DO.get(stubID)
      await stub.validateTwitchChannels()
      break
  }
}

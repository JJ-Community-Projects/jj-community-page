import { scheduledTwitch } from './scheduledTwitch.ts'
import { scheduledYogsJJAP } from './scheduledYogsJJAPI.ts'

export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  switch (controller.cron) {
    case '*/2 * * * *':
      await scheduledTwitch(controller, env, ctx)
      break
    case '*/1 * 1-15 12 *':
      await scheduledYogsJJAP(controller, env, ctx)
      break
  }
}

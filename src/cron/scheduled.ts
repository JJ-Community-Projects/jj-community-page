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
      const startTimes = {
        fx: Date.now(), tiltify: 0, twitch: 0, tags: 0,
      }

      const task1 = (async () => {
        console.log('scheduled', 'fetchGBPToEURConversionRate')
        await stub.fetchGBPToEURConversionRate()
        console.log('fetchGBPToEURConversionRate ms', Date.now() - startTimes.fx)
      })

      const task2 = (async () => {
        startTimes.tiltify = Date.now()
        console.log('scheduled', 'loadAllTiltifySocials')
        await stub.loadAllTiltifySocials()
        console.log('loadAllTiltifySocials ms', Date.now() - startTimes.tiltify)
      })

      const task3 = (async () => {
        startTimes.twitch = Date.now()
        console.log('scheduled', 'validateTwitchChannels')
        await stub.validateTwitchChannels()
        console.log('validateTwitchChannels ms', Date.now() - startTimes.twitch)
      })

      const task4 = (async () => {
        startTimes.tags = Date.now()
        console.log('scheduled', 'buildAndStoreUserTags')
        await stub.buildAndStoreUserTags()
        console.log('buildAndStoreUserTags ms', Date.now() - startTimes.tags)
      })

      const results = await Promise.allSettled([
        task1(), task2(), task3(), task4()
      ])
      for (const r of results) if (r.status === 'rejected') console.error(r.reason)
      break
  }
}

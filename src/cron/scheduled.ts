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
    case '0 */12 * * *':
      await validateTwitchChannels(env)
      break
    case '0 */6 * * *':
      await fetchGBPToEURConversionRate(env)
      break
    case '0 */4 * * *':
      await loadAllTiltifySocials(env)
      break
    case '0 */2 * * *':
      await buildAndStoreUserTags(env)
      break
  }
}

async function fetchGBPToEURConversionRate(env: Env) {
  try {
    const DO = env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const start = Date.now()
    console.log('scheduled', 'fetchGBPToEURConversionRate')
    await stub.fetchGBPToEURConversionRate()
    console.log('fetchGBPToEURConversionRate ms', Date.now() - start)
  } catch (e) {
    console.error(e)
  }
}
async function loadAllTiltifySocials(env: Env) {
  try {
    const DO = env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const start = Date.now()
    console.log('scheduled', 'loadAllTiltifySocials')
    await stub.loadAllTiltifySocials()
    console.log('loadAllTiltifySocials ms', Date.now() - start)
  } catch (e) {
    console.error(e)
  }
}

async function validateTwitchChannels(env: Env) {
  try {
    const DO = env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const start = Date.now()
    console.log('scheduled', 'validateTwitchChannels')
    await stub.validateTwitchChannels()
    console.log('validateTwitchChannels ms', Date.now() - start)
  } catch (e) {
    console.error(e)
  }
}
async function buildAndStoreUserTags(env: Env) {
  try {
    const DO = env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)
    const start = Date.now()
    console.log('scheduled', 'buildAndStoreUserTags')
    await stub.validateTwitchChannels()
    console.log('buildAndStoreUserTags ms', Date.now() - start)
  } catch (e) {
    console.error(e)
  }
}

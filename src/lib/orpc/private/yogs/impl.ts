import { implement } from '@orpc/server'
import { contracts } from './contract'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'
import { storeYogsSchedule } from './util.ts'
import { getEntry } from 'astro:content'
import { getYogsScheduleFromContent } from '../../../../content/getYogsScheduleFromContent.ts'

const os = implement(contracts).use(hasAstroContext)

export const config = os.config.handler(async ({ context }) => {
  const ConfigDO = context.env.ConfigDO
  const stubId = ConfigDO.idFromName('ConfigDO')
  const stub = ConfigDO.get(stubId)
  const showUserFundraiser = await stub.getBooleanConfig(
    'web:config.showSchedule',
  )
  return { showSchedule: showUserFundraiser ?? true }
})

export const schedule = os.schedule.handler(async ({ context }) => {
  /*const yogsSchedule = await loadYogsSchedule(context.env.KV)

  if (yogsSchedule) {
    return yogsSchedule
  }*/

  // Resolve the current schedule year from the Config Durable Object
  const ConfigDO = context.env.ConfigDO
  const stubId = ConfigDO.idFromName('ConfigDO')
  const stub = ConfigDO.get(stubId)
  const year = await stub.getNumberConfig('web:config.year')

  // Load the schedule entry for the given year from Astro content collections
  const schedule = await getEntry('schedules', `${year ?? 2024}`)
  if (!schedule) {
    const now = new Date()
    return {
      title: `Yogscast Jingle Jam ${year ?? 2024}`,
      start: now,
      end: now,
      initialDayIndex: 0,
      days: [],
      streams: [],
      weeks: [],
      times: [],
      creators: [],
    }
  }
  const result = await getYogsScheduleFromContent(year ?? 2024)
  await storeYogsSchedule(context.env.KV, result, 600)
  return result
})

export const yogsRouter = {
  config,
  schedule,
}

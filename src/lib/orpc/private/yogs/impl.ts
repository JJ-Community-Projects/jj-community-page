import { implement, ORPCError } from '@orpc/server'
import { contracts } from './contract'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'
import {
  loadSchedule,
  loadYogsSchedule,
  storeSchedule,
  storeYogsSchedule,
} from './util.ts'
import { getEntry } from 'astro:content'
import {
  getScheduleFromContent,
  getYogsScheduleFromContent,
} from '../../../../content/getYogsScheduleFromContent.ts'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'

const os = implement(contracts).use(hasAstroContext)

export const config = os.config
  .use(
    cacheMiddleware({
      maxAge: 60,
      sMaxAge: 60,
      staleWhileRevalidate: 30,
    }),
  )
  .handler(async ({ context }) => {
    const ConfigDO = context.env.ConfigDO
    const stubId = ConfigDO.idFromName('ConfigDO')
    const stub = ConfigDO.get(stubId)
    const showUserFundraiser = await stub.getBooleanConfig(
      'web:config.showSchedule',
    )
    return { showSchedule: showUserFundraiser ?? true }
  })

export const schedule = os.schedule
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 150,
    }),
  )
  .handler(async ({ context }) => {
    try {
      const yogsSchedule = await loadYogsSchedule(context.env.KV)

      if (yogsSchedule) {
        return yogsSchedule
      }
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
      await storeYogsSchedule(context.env.KV, result, 300)
      return result
    } catch (e) {
      console.error('yogs.schedule', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to fetch yogs schedule',
      })
    }
  })

export const headliner = os.schedule
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 150,
    }),
  )
  .handler(async ({ context }) => {
    try {
      const cachedSchedule = await loadSchedule(context.env.KV, 'web:headliner-schedule')

      if (cachedSchedule) {
        return cachedSchedule
      }

      const schedule = await getEntry('schedules', `2025-headliner`)
      if (!schedule) {
        const now = new Date()
        return {
          title: `Headliner`,
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
      const result = await getScheduleFromContent(`2025-headliner`)
      await storeSchedule(context.env.KV,'web:headliner-schedule',  result, 300)
      return result
    } catch (e) {
      console.error('headliner.schedule', e)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to fetch headliner schedule',
      })
    }
  })

export const yogsRouter = {
  config,
  schedule,
  headliner
}

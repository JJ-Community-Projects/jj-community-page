import { env } from 'cloudflare:workers'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (ctx) => {
  const DO = env.JingleJamData
  const id = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(id)
  const nextAlarm = await stub.getNextAlarmStr()
  console.log(nextAlarm)
  return new Response(nextAlarm)
}

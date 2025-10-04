import { getDB } from '../lib/db/db.ts'

export async function scheduledYogsJJAP(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  const db = getDB(env)
  const DO = env.JingleJamData
}

export async function scheduledYogsJJAP(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) {
  const DO = env.JingleJamData
  const stub = DO.get(DO.idFromName('JJ_API_CACHE'))
  await stub.refresh()
  await stub.insertIntoDB()
}

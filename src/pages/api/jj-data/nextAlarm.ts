import type {APIRoute} from "astro";

export const GET: APIRoute = async (ctx) => {
  const DO = ctx.locals.runtime.env.JingleJamData
  const id = DO.idFromName('JJ')
  const stub = DO.get(id)
  const nextAlarm = await stub.getNextAlarmStr()
  console.log(nextAlarm)
  return new Response(nextAlarm)
};

import type {APIRoute} from "astro";
import {getDB} from "../../../../lib/db/db.ts";
import {scheduleUiView} from "../../../../lib/db/schema/views-schema.ts";
import {eq} from "drizzle-orm";

export const GET: APIRoute = async (ctx) => {

  const id = ctx.params.c

  if (!id) {
    return new Response("Test id not found", {status: 404});
  }
  const db = getDB(ctx)

  // https://dashboardapi.tiltify.com/oauth/authorize?client_id=1972e158842e4ec02d8028a6939eae8472f8504ca39e52dd5fa77442d3a8b13d&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Ftiltify%2Fcallback%2F&response_type=code&scope=public&state=XNUpJFBw70h3Qc_gdbBolSgopM8yK00M5gCEOxkuDY8
  const data = await db.select()
    .from(scheduleUiView)
    .where(eq(scheduleUiView.id, parseInt(id)))
    .get()

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {"content-type": "application/json"},
  })
  /*
  const fetch =  getWsServerDurableObjectFetch('ScheduleEditorDO')

  console.log('GET',ctx.request)
  return fetch(ctx.request, {
    ScheduleEditorDO: DO
  })*/
  // return scheduleDO.fetch(newReq)
}

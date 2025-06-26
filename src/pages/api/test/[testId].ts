import type {APIRoute} from "astro";

export const GET: APIRoute = async (ctx) => {
  const DO = ctx.locals.runtime.env.ScheduleEditorDO //  as unknown as DurableObjectNamespace<WsServerDurableObject<unknown>>
  if (!DO) {
    return new Response("Durable object not found", {status: 404});
  }
  const testId = ctx.params.testId
  if (!testId) {
    return new Response("Test id not found", {status: 404});
  }

  const id = DO.idFromName(testId);
  const stub = DO.get(id)
  const data = await stub.getTables()

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

import type {APIRoute} from "astro";
import {
  getWsServerDurableObjectFetch,
  type WsServerDurableObject
} from "tinybase/synchronizers/synchronizer-ws-server-durable-object";

export const GET: APIRoute = (ctx) => {
  const DO = ctx.locals.runtime.env.TinyDO //  as unknown as DurableObjectNamespace<WsServerDurableObject<unknown>>
  if (!DO) {
    return new Response("Durable object not found", {status: 404});
  }
  const testId = ctx.params.testId
  if (!testId){
    return new Response("Test id not found", {status: 404});
  }

  const id = DO.idFromName(testId);
  const stub = DO.get(id)
  return stub.fetch(ctx.request)
  /*
  const fetch =  getWsServerDurableObjectFetch('ScheduleEditorDO')

  console.log('GET',ctx.request)
  return fetch(ctx.request, {
    ScheduleEditorDO: DO
  })*/
  // return scheduleDO.fetch(newReq)
}

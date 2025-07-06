import type {APIRoute} from "astro";
import {useRpcScheduleEditorDO} from "../../../../../actions/getDO.ts";

export const GET: APIRoute = async (ctx) => {
  const DO = ctx.locals.runtime.env.ScheduleEditorDO //  as unknown as DurableObjectNamespace<WsServerDurableObject<unknown>>
  if (!DO) {
    return new Response("Durable object not found", {status: 404});
  }
  const id = ctx.params.c

  if (!id) {
    return new Response("Test id not found", {status: 404});
  }

  const data = useRpcScheduleEditorDO(ctx, parseInt(id), (rpc) => {
    return rpc.getTables()
  }, (e) => {
  })

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

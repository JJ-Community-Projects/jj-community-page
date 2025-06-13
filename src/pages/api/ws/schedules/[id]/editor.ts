import type {APIRoute} from "astro";


export const GET: APIRoute = async (ctx) => {

  // TODO auth check


  const id = ctx.params.id;
  if (!id) {
    throw new Error("id is required");
  }

  const DO = ctx.locals.runtime.env.ScheduleEditorDO //  as unknown as DurableObjectNamespace<WsServerDurableObject<unknown>>

  if (!DO) {
    return new Response("Durable object not found", {status: 404});
  }
  const doId = DO.idFromName(id)
  const stub = DO.get(doId)
  await stub.loadFromDB()
  return stub.fetch(ctx.request)
}

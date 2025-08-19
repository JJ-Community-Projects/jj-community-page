import type {APIRoute} from "astro";


export const GET: APIRoute = async (ctx) => {

  // TODO auth check
  const id = ctx.params.id;
  if (!id) {
    throw new Error("id is required");
  }
  const DO = ctx.locals.runtime.env.ScheduleEditorDO
  const stubID = DO.idFromName(id)

  const stub = DO.get(stubID) //await getScheduleEditorDO(ctx, parseInt(id))
  await stub.loadFromDB(id)
  return stub.fetch(ctx.request)
}

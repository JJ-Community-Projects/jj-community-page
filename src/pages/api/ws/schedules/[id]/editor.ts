import type {APIRoute} from "astro";
import {getScheduleEditorDO} from "../../../../../actions/getDO.ts";


export const GET: APIRoute = async (ctx) => {

  // TODO auth check
  const id = ctx.params.id;
  if (!id) {
    throw new Error("id is required");
  }

  const stub = await getScheduleEditorDO(ctx, parseInt(id))
  await stub.loadFromDB(id)
  return stub.fetch(ctx.request)
}

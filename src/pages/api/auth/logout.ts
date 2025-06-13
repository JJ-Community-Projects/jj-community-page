import type {APIRoute} from "astro";
import {deleteSessionTokenCookie, invalidateSession} from "../../../functions/session";

export const POST: APIRoute = async (context) => {
  if (context.locals.session === null) {
    return context.redirect('/')
  }
  await invalidateSession(context, context.locals.session.id);
  deleteSessionTokenCookie(context);
  return context.redirect('/')
}

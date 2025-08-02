import {ActionError, type ActionAPIContext} from "astro:actions";
import type {Session} from "../lib/auth/Session.ts";
import type { User } from "../lib/auth/User.ts";


export function handleUnauthorized(context: ActionAPIContext): {
  session: Session,
  user: User,
} {
  const {session, user} = context.locals
  if (!session || !user) {
    throw new ActionError({code: 'UNAUTHORIZED'});
  }
  return {
    session,
    user
  }
}

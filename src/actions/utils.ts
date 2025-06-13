import {ActionError, type ActionAPIContext} from "astro:actions";


export function handleUnauthorized(context: ActionAPIContext) {
  const {session, user} = context.locals
  if (!session || !user) {
    throw new ActionError({code: 'UNAUTHORIZED'});
  }
}

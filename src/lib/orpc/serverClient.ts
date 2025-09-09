import {createSafeClient} from "@orpc/client";
import {createRouterClient} from "@orpc/server";
import {publicRouter} from "./public/publicRouter.ts";
import {privateRouter} from "./private/privateRouter.ts";

export const serverClientPublic = createSafeClient(
  createRouterClient<typeof publicRouter, {
    locals: App.Locals, request: Request,
  }>(publicRouter, {
    context: (clientContext: { locals: App.Locals, request: Request }) => ({
      locals: clientContext.locals,
      request: clientContext.request
    })
  })
)

export const serverClientPrivate = createSafeClient(
  createRouterClient<typeof privateRouter, {
    locals: App.Locals, request: Request,
  }>(privateRouter, {
    context: (clientContext: { locals: App.Locals, request: Request }) => ({
      locals: clientContext.locals,
      request: clientContext.request
    })
  })
)

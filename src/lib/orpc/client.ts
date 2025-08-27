import {createRouterClient, type RouterClient} from "@orpc/server";
import {publicRouter} from "./public/publicRouter.ts";
import {privateRouter} from "./private/privateRouter.ts";
import {RPCLink} from "@orpc/client/fetch";
import {createORPCClient, createSafeClient, onError} from '@orpc/client'
import {createTanstackQueryUtils} from "@orpc/tanstack-query";

const linkPublic = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${window.location.origin}/api/public`
  },
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ],
})

const linkPrivate = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    const url = `${window.location.origin}/api/private`
    console.log('linkPrivate', 'url', url)
    return url
  },
  interceptors: [
    onError((error) => {
      console.error('linkPrivate', error)
    })
  ],
})

// const client = createORPCClient<RouterClient<typeof router>>(link)

// Create separate clients for public and private routers
const publicClient = createORPCClient<RouterClient<typeof publicRouter>>(linkPublic)
const privateClient = createORPCClient<RouterClient<typeof privateRouter>>(linkPrivate)

export const orpcPublic = createTanstackQueryUtils(publicClient)
export const orpcPrivate = createTanstackQueryUtils(privateClient)

// Split server clients as well
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

// Maintain backward compatibility temporarily (remove after refactoring)
// export const orpc = createTanstackQueryUtils(client)
/*
export const serverClient = createSafeClient(
  createRouterClient(router)
)
*/

import {RPCLink} from "@orpc/client/fetch";
import {createORPCClient, onError} from '@orpc/client'
import {createTanstackQueryUtils} from "@orpc/tanstack-query";
import {DurableEventIteratorLinkPlugin} from "@orpc/experimental-durable-event-iterator/client";
import type {PrivateRouter} from "./privateRouter";
import type {RouterClient} from "@orpc/server";

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
  plugins: [
    new DurableEventIteratorLinkPlugin({
      url: () => {
        if (typeof window === 'undefined') throw new Error('RPCLink is not allowed on the server side.')
        const url = `${window.location.origin}/api/private/ws` // single WS entry
        console.log('linkPrivateWS', 'url', url)
        return url
      },
    }),
  ],
})

// Create separate clients for public and private routers
// const publicClient = createORPCClient<RouterClient<PublicRouter>>(linkPublic)
const privateClient = createORPCClient<RouterClient<PrivateRouter>>(linkPrivate)
const publicClient = createORPCClient<any>(linkPublic)
// const privateClient = createORPCClient<any>(linkPrivate)

export const orpcPublic = createTanstackQueryUtils(publicClient)
export const orpcPrivate = createTanstackQueryUtils(privateClient)

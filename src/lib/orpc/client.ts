import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient, onError } from '@orpc/client'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { PrivateRouter } from './privateRouter'
import type { RouterClient } from '@orpc/server'
import { DurableIteratorLinkPlugin } from '@orpc/experimental-durable-iterator/client'
import {
  renewTokenBeforeExpiry,
  type TokenRenewalContext,
  TokenRenewalPlugin,
} from './tokenRenewal.ts'

declare module '@orpc/experimental-durable-iterator/client' {
  interface ClientDurableIteratorRpcContext {
    // Custom client context
  }
}

type PrivateClientContext = TokenRenewalContext

const linkPrivate = new RPCLink<PrivateClientContext>({
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
    }),
  ],
  plugins: [
    new DurableIteratorLinkPlugin({
      url: () => {
        if (typeof window === 'undefined')
          throw new Error('RPCLink is not allowed on the server side.')
        const url = `${window.location.origin}/api/private/ws` // single WS entry
        console.log('linkPrivateWS', 'url', url)
        return url
      },
      // Only subscriptions that set `context.tokenRenewal` renew their token: the schedule
      // editor and the friends and teams feeds (`feedRenewal`).
      refreshTokenBeforeExpireInSeconds: renewTokenBeforeExpiry,
    }),
    new TokenRenewalPlugin(),
  ],
})

// The public router has no browser client: pages call it in-process (`serverClientPublic`) and
// `/api/public` serves only the Twitch extension.
const privateClient =
  createORPCClient<RouterClient<PrivateRouter, PrivateClientContext>>(
    linkPrivate,
  )
// const privateClient = createORPCClient<any>(linkPrivate)

export const orpcPrivate = createTanstackQueryUtils(privateClient)

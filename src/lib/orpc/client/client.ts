import type {RouterClient} from "@orpc/server";
import type {router} from "../router.ts";
import {RPCLink} from "@orpc/client/fetch";
import {createORPCClient, onError} from '@orpc/client'
import {createTanstackQueryUtils} from "@orpc/tanstack-query";

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${window.location.origin}/api/orpc`
  },
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ],
})

const client = createORPCClient<RouterClient<typeof router>>(link)

export const orpc = createTanstackQueryUtils(client)

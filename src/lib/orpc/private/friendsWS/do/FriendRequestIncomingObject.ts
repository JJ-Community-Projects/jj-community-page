import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getUserFriendRequests } from '../util.ts'

export class FriendRequestIncomingObject extends DurableIteratorObject<{
  users: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(e))],
      onSubscribed: async (websocket, _lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        console.log('FriendRequestIncomingObject', 'onSubscribed', att)
        if (!att) return
        const { userId } = att as any
        if (!userId) return
        const db = getDB(env)
        const users = await getUserFriendRequests(db, userId)
        this.publishEvent(
          {
            users,
            event: 'update',
          },
          {
            targets: [websocket],
          },
        )
      },
    })
  }

  // RPC called by publisher via fetch to this DO instance
  public async publishChange(users: UserDisplay[]): Promise<Response> {
    try {
      this.publishEvent({
        users,
        event: 'update',
      })
      console.log(
        'FriendRequestIncomingObject',
        `Received ${JSON.stringify(users)}`,
      )
      return new Response('ok')
    } catch (err) {
      console.warn('[FriendRequestIncomingObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

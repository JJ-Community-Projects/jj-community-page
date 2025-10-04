import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getUserFriends } from '../util.ts'

export class FriendsListObject extends DurableIteratorObject<{
  friends: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [
        onError((e) => console.error(e)), // log error thrown from rpc calls
      ],
      onSubscribed: async (websocket, lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        if (!att) return
        const { userId } = att as any
        if (!userId) return
        const db = getDB(env)
        const friends = await getUserFriends(db, userId)
        this.publishEvent(
          {
            friends,
            event: 'update',
          },
          {
            targets: [websocket],
          },
        )
      },
    })
  }

  async publishChange(friends: UserDisplay[]): Promise<Response> {
    try {
      this.publishEvent({
        friends,
        event: 'update',
      })
      console.log('FriendsListObject', `Received ${JSON.stringify(friends)}`)
      return new Response('ok')
    } catch (err) {
      console.warn('[FriendsListObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

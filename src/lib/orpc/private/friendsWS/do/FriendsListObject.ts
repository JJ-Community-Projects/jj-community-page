import { env } from 'cloudflare:workers'
import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { loggableError } from '../../../../db/loggableError.ts'
import { getUserFriends } from '../util.ts'

export class FriendsListObject extends DurableIteratorObject<{
  friends: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState<{}>, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [
        onError((e) => console.error(loggableError(e))), // log error thrown from rpc calls
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

  /** After a mutation: sends the user's friends to the open sockets; with none open, no D1 query. */
  async refresh(userId: number): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return
    const friends = await getUserFriends(getDB(env), userId)
    this.publishEvent({ friends, event: 'update' })
  }
}

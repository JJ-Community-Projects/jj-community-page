import { env } from 'cloudflare:workers'
import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { loggableError } from '../../../../db/loggableError.ts'
import { getSendUserFriendRequests } from '../util.ts'

export class FriendRequestSentObject extends DurableIteratorObject<{
  users: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState<{}>, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(loggableError(e)))],
      onSubscribed: async (websocket, _lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        if (!att) return
        const { userId } = att as any
        if (!userId) return
        const db = getDB(env)
        const users = await getSendUserFriendRequests(db, userId)
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

  /** After a mutation: sends the user's sent friend requests to the open sockets; with none open, no D1 query. */
  async refresh(userId: number): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return
    const users = await getSendUserFriendRequests(getDB(env), userId)
    this.publishEvent({ users, event: 'update' })
  }
}

import { env } from 'cloudflare:workers'
import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { loggableError } from '../../../../db/loggableError.ts'
import { getUserInvites } from '../util.ts'

export class UserTeamInvitesObject extends DurableIteratorObject<{
  invites: { teamId: number; name: string }[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(loggableError(e)))],
      onSubscribed: async (websocket, _lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        if (!att) return
        const { userId } = att as any
        if (!userId) return
        const db = getDB(env)
        const invites = await getUserInvites(db, userId)
        this.publishEvent(
          { invites, event: 'update' },
          { targets: [websocket] },
        )
      },
    })
  }

  /** After a mutation: sends the user's team invites to the open sockets; with none open, no D1 query. */
  async refresh(userId: number): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return
    const invites = await getUserInvites(getDB(env), userId)
    this.publishEvent({ invites, event: 'update' })
  }
}

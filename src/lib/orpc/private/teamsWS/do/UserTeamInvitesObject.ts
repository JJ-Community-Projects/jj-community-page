import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getUserInvites } from '../util.ts'

export class UserTeamInvitesObject extends DurableIteratorObject<{
  invites: { teamId: number; name: string }[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(e))],
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

  async publishChange(
    invites: { teamId: number; name: string }[],
  ): Promise<Response> {
    try {
      this.publishEvent({
        invites,
        event: 'update',
      })
      return new Response('ok')
    } catch (err) {
      console.warn('[UserTeamInvitesObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

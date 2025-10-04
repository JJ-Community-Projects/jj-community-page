import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getTeamInvites } from '../util.ts'

export class TeamAdminInvitesObject extends DurableIteratorObject<{
  invites: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(e))],
      onSubscribed: async (websocket, _lastEventId) => {
        const att = websocket['~orpc'].deserializeTokenPayload().att
        if (!att) return
        const { teamId } = att as any
        if (!teamId) return
        const db = getDB(env)
        const invites = await getTeamInvites(db, teamId)
        this.publishEvent(
          { invites, event: 'update' },
          { targets: [websocket] },
        )
      },
    })
  }

  async publishChange(invites: UserDisplay[]): Promise<Response> {
    try {
      this.publishEvent({
        invites,
        event: 'update',
      })
      return new Response('ok')
    } catch (err) {
      console.warn('[TeamAdminInvitesObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

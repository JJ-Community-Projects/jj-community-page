import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getTeamMembers } from '../util.ts'

export class TeamAdminMembersObject extends DurableIteratorObject<{
  members: UserDisplay[]
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
        const members = await getTeamMembers(db, teamId)
        this.publishEvent(
          { members, event: 'update' },
          { targets: [websocket] },
        )
      },
    })
  }

  async publishChange(members: UserDisplay[]): Promise<Response> {
    try {
      this.publishEvent({
        members,
        event: 'update',
      })
      return new Response('ok')
    } catch (err) {
      console.warn('[TeamAdminMembersObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

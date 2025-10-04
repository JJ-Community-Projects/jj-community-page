import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { Team } from '../../../public/schemas/teams.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { getUserTeams } from '../util.ts'

export class UserTeamsObject extends DurableIteratorObject<{
  teams: Team[]
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
        const teams = await getUserTeams(db, userId)
        this.publishEvent(
          { teams, event: 'update' },
          { targets: [websocket] },
        )
      },
    })
  }

  async publishChange(teams: Team[]): Promise<Response> {
    try {
      this.publishEvent({
        teams,
        event: 'update',
      })
      return new Response('ok')
    } catch (err) {
      console.warn('[UserTeamsObject] publishChange failed', err)
      return new Response('error', { status: 500 })
    }
  }
}

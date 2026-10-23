import { env } from 'cloudflare:workers'
import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { loggableError } from '../../../../db/loggableError.ts'
import { getTeamMembers } from '../util.ts'

export class TeamAdminMembersObject extends DurableIteratorObject<{
  members: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(loggableError(e)))],
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

  /** After a mutation: sends the team's members to the open sockets; with none open, no D1 query. */
  async refresh(teamId: number): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return
    const members = await getTeamMembers(getDB(env), teamId)
    this.publishEvent({ members, event: 'update' })
  }
}

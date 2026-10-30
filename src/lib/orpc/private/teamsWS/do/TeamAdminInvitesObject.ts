import { env } from 'cloudflare:workers'
import { DurableIteratorObject } from '@orpc/experimental-durable-iterator/durable-object'
import type { UserDisplay } from '../../schemas/users.ts'
import { onError } from '@orpc/client'
import { getDB } from '../../../../db/db.ts'
import { loggableError } from '../../../../db/loggableError.ts'
import { getTeamInvites } from '../util.ts'

export class TeamAdminInvitesObject extends DurableIteratorObject<{
  invites: UserDisplay[]
  event: 'update'
}> {
  constructor(state: DurableObjectState<{}>, env: Env) {
    super(state, env, {
      signingKey: env.ORPC_DEI_SIGNING_KEY,
      interceptors: [onError((e) => console.error(loggableError(e)))],
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

  /** After a mutation: sends the team's pending invites to the open sockets; with none open, no D1 query. */
  async refresh(teamId: number): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return
    const invites = await getTeamInvites(getDB(env), teamId)
    this.publishEvent({ invites, event: 'update' })
  }
}

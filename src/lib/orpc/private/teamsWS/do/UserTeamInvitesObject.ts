import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';

export class UserTeamInvitesObject extends DurableEventIteratorObject<{
  invites: { teamId: number; name: string }[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  async publishChange(invites: { teamId: number; name: string }[]): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        invites,
        event: 'update',
      });
      return new Response('ok');
    } catch (err) {
      console.warn('[UserTeamInvitesObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

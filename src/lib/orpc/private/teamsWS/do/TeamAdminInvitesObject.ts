import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';
import type {UserDisplay} from "../../schemas/users.ts";

export class TeamAdminInvitesObject extends DurableEventIteratorObject<{
  invites: UserDisplay[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  async publishChange(invites: UserDisplay[]): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        invites,
        event: 'update',
      });
      return new Response('ok');
    } catch (err) {
      console.warn('[TeamAdminInvitesObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

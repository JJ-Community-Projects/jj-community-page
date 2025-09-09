import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';
import type {UserDisplay} from "../../schemas/users.ts";

export class TeamAdminMembersObject extends DurableEventIteratorObject<{
  members: UserDisplay[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  async publishChange(members: UserDisplay[]): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        members,
        event: 'update',
      });
      return new Response('ok');
    } catch (err) {
      console.warn('[TeamAdminMembersObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

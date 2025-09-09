import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';
import type {UserDisplay} from "../../schemas/users.ts";

export class FriendRequestIncomingObject extends DurableEventIteratorObject<{
  users: UserDisplay[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  // RPC called by publisher via fetch to this DO instance
  async publishChange(users: UserDisplay[]): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        users,
        event: 'update',
      });
      console.log(`Received ${JSON.stringify(users)}`);
      return new Response('ok');
    } catch (err) {
      console.warn('[FriendRequestIncomingObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

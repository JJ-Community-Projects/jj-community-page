import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';
import type {UserDisplay} from "../../schemas/users.ts";

export class FriendsListObject extends DurableEventIteratorObject<{
  friends: UserDisplay[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
    console.log('FriendsListObject', 'state', state);
  }

  fetch(request: Request): Promise<Response> {
    console.log('FriendsListObject', 'fetch', 'request', request);
    return super.fetch(request);
  }

  async publishChange(friends: UserDisplay[]): Promise<Response> {
    try {
      this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        friends,
        event: 'update',
      });
      console.log(`Received ${JSON.stringify(friends)}`);
      return new Response('ok');
    } catch (err) {
      console.warn('[FriendsListObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

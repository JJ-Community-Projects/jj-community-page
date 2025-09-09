import {DurableEventIteratorObject} from '@orpc/experimental-durable-event-iterator/durable-object';
import type {Team} from "../../../public/schemas/teams.ts";

export class UserTeamsObject extends DurableEventIteratorObject<{
  teams: Team[]
  event: 'update',
}> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, {eventRetentionSeconds: 300});
  }

  async publishChange(teams: Team[]): Promise<Response> {
    try {
      await this.dei.websocketManager.publishEvent(this.ctx.getWebSockets(), {
        teams,
        event: 'update',
      });
      return new Response('ok');
    } catch (err) {
      console.warn('[UserTeamsObject] publishChange failed', err);
      return new Response('error', {status: 500});
    }
  }
}

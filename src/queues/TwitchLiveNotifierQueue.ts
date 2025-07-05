import type {MessageSendRequest} from "@cloudflare/workers-types/experimental/index.ts";


export class TwitchLiveNotifierQueue {

  send(twitchIds: string[], env: Env) {
    const msgs: MessageSendRequest[] = twitchIds.map((id) => ({
      body: id,
      contentType: 'text'
    }))
    return env.TWITCH_LIVE_NOTIFIER.sendBatch(msgs, {
      delaySeconds: 5,
    })
  }


  async handle(batch: MessageBatch<string>, env: Env, ctx: ExecutionContext) {
    for (const msg of batch.messages) {
      try {
        await this.handleSingleId(msg.body)
        msg.ack()
      } catch (e) {
        console.error('', e)
        msg.retry({
          delaySeconds: 10,
        })
      }
    }
  }

  private async handleSingleId(twitchId: string) {

  }


}

import type {MessageSendRequest} from "@cloudflare/workers-types/experimental/index.ts";
import {UserRepo} from "../lib/db/repos/UserRepo.ts";
import {TwitchRepo} from "../lib/db/repos/TwitchRepo.ts";
import type {UserLiveState} from "../lib/db/models/user-ui.ts";


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
    console.log('TwitchLiveNotifierQueue', 'Received batch', batch)
    for (const msg of batch.messages) {
      try {
        const result = await this.handleSingleId(msg.body, env)
        if (result) {
          msg.ack()
        } else {
          msg.retry({
            delaySeconds: 10,
          })
        }
      } catch (e) {
        console.error('TwitchLiveNotifierQueue', 'handle', e)
        msg.retry({
          delaySeconds: 10,
        })
      }
    }
  }

  private async handleSingleId(twitchId: string, env: Env): Promise<boolean> {
    console.log('TwitchLiveNotifierQueue', 'handleSingleId', twitchId)
    const userRepo = UserRepo.withEnv(env, 'queue')
    const twitchRepo = TwitchRepo.withEnv(env, 'queue')

    const channel = await twitchRepo.getChannelByTwitchId(twitchId)

    if (!channel) {
      console.error('TwitchLiveNotifierQueue', 'handleSingleId', twitchId, 'channel not found')
      return false
    }

    const userId = channel.userId

    const user = await userRepo.findById(userId)

    if (!user) {
      console.error('TwitchLiveNotifierQueue', 'handleSingleId', twitchId, 'userId not found')
      return false
    }

    const tiltifyMetaData = await userRepo.getTiltifyMetaData(userId)

    if (!tiltifyMetaData) {
      console.error('TwitchLiveNotifierQueue', 'handleSingleId', twitchId, 'tiltify userId not found')
      return false
    }

    const twitchStream = await twitchRepo.getStreamByUserId(twitchId)

    console.log('TwitchLiveNotifierQueue', 'userId', userId)
    const DO = env.UserLiveStatusDO
    const doId = DO.idFromName(`${userId}`)
    const userStub = DO.get(doId)
    const rpc = await userStub.setMetaData(`${userId}`)

    if (!rpc) {
      console.error('no rpc stub')
    }

    if (!twitchStream) {
      const state: UserLiveState = {
        id: userId,
        name: tiltifyMetaData.username,
        slug: tiltifyMetaData.slug,
        isLive: false,
        primaryLiveStream: user.primaryLiveStream,
        channel: {}
      }
      console.log('TwitchLiveNotifierQueue', 'handleSingleId', 'state', state)
      await rpc.setUserLiveState(state)
    } else {
      const state: UserLiveState = {
        id: userId,
        name: tiltifyMetaData.username,
        slug: tiltifyMetaData.slug,
        isLive: true,
        primaryLiveStream: user.primaryLiveStream,
        channel: {
          twitch: channel,
        }
      }
      console.log('TwitchLiveNotifierQueue', 'handleSingleId', 'state', state)

      await rpc.setUserLiveState(state)
    }

    (await rpc)[Symbol.dispose]?.()

    console.log('TwitchLiveNotifierQueue', 'handleSingleId', twitchId, 'done')

    return true
  }


}

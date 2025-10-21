import type { MessageSendRequest } from '@cloudflare/workers-types/experimental/index.ts'

export class TwitchLiveCheckQueue {
  /**
   * Sends a batch of Twitch user IDs to the queue for live status checking
   *
   * @param ids - Array of Twitch user IDs to check
   * @param env - Environment variables containing queue reference
   * @returns Promise from the queue's sendBatch operation
   */
  send(ids: string[], env: Env) {
    const msgs: MessageSendRequest[] = ids.map((id) => ({
      body: id,
      contentType: 'text',
    }))
    if (msgs.length === 0) {
      return
    }
    return (
      env.TWITCH_LIVE_CHECK.sendBatch(msgs, {
        delaySeconds: 5,
      })
    )
  }

  /**
   * Processes a batch of messages containing Twitch user IDs
   * Fetches current stream data for these users and updates the database
   * - Removes entries for users who are not live
   * - Inserts or updates entries for users who are live
   *
   * @param batch - Batch of messages containing Twitch user IDs
   * @param env - Environment variables containing Durable Object references and DB
   * @param ctx - Execution context
   */
  async handle(batch: MessageBatch<string>, env: Env, ctx: ExecutionContext) {
    // Extract user IDs from the message batch
    const messages = batch.messages
    const ids = messages.map((message) => message.body)
    batch.ackAll()
    console.log('twitch-live-checkQueue', 'handle', 'done', ids)

    /*

    // Get the TwitchAPI Durable Object to fetch stream data
    const DO = env.TwitchAPIDO
    const id = DO.idFromName("twitch-live-checkQueue")
    const stub = DO.get(id)

    // If we can't get the DO, retry the batch
    if (!stub) {
      batch.retryAll({
        delaySeconds: 10,
      })
      return
    }

    // Fetch stream data for the user IDs
    const {data, error} = await stub.fetchStreamsByUserIds(ids)

    // If there's an error, retry the batch
    if (error) {
      batch.retryAll({
        delaySeconds: 10,
      })
      return
    }

    // Extract IDs of users who are currently live
    const liveIds = data.data.map((stream) => stream.user_id)

    // Determine which users are not live
    const notLiveIds = ids.filter(id => !liveIds.includes(id))

    // Get database connection and create TwitchRepo instance
    const twitchRepo = new TwitchRepo(env, 'queue');

    try {
      // Delete entries for users who are not live
      if (notLiveIds.length > 0) {
        await twitchRepo.deleteMultipleStreams(notLiveIds);
      }

      // Prepare stream data for insertion
      const streamsToInsert = data.data.map(stream => ({
        streamId: stream.id,
        twitchId: stream.user_id,
        userLogin: stream.user_login,
        userName: stream.user_name,
        gameId: stream.game_id,
        gameName: stream.game_name,
        type: stream.type,
        title: stream.title,
        viewerCount: stream.viewer_count,
        startedAt: stream.started_at,
        language: stream.language,
        thumbnailUrl: stream.thumbnail_url,
        tagIds: stream.tag_ids ? JSON.stringify(stream.tag_ids) : null,
        isMature: stream.is_mature
      }));

      // Insert entries for users who are live
      if (streamsToInsert.length > 0) {
        await twitchRepo.insertMultipleStreams(streamsToInsert);
      }

      const notifier = new twitch-live-notifierQueue()
      await notifier.send(ids, env)
      batch.ackAll()
      console.log('twitch-live-checkQueue', 'handle', 'done')
    } catch (e) {
      console.error('twitch-live-checkQueue', 'handle', e)
      batch.retryAll({
        delaySeconds: 10,
      })
    }*/
  }
}

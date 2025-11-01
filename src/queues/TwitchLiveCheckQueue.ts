import type { MessageSendRequest } from '@cloudflare/workers-types/experimental/index.ts'
import { TwitchAPI } from '../lib/twitchAPI.ts'
import { getDB } from '../lib/db/db.ts'
import { twitchStreamSchema } from '../lib/db/schema/twitch-channel-schema.ts'
import { and, inArray, notInArray } from 'drizzle-orm'
import type { TwitchStream } from '../lib/model/TwitchAPIModel.ts'

export class TwitchLiveCheckQueue {
  sendIds(ids: string[], env: Env) {
    const msgs: MessageSendRequest<string>[] = ids.map((id) => ({
      body: JSON.stringify({ type: 'id', value: id }),
      contentType: 'text',
    }))
    if (msgs.length === 0) {
      return
    }
    return env.TWITCH_LIVE_CHECK.sendBatch(msgs, {
      delaySeconds: 5,
    })
  }

  sendLogins(logins: string[], env: Env) {
    const msgs: MessageSendRequest<string>[] = logins.map((login) => ({
      body: JSON.stringify({ type: 'login', value: login }),
      contentType: 'text',
    }))
    if (msgs.length === 0) {
      return
    }
    return env.TWITCH_LIVE_CHECK.sendBatch(msgs, {
      delaySeconds: 5,
    })
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
    const messages = batch.messages

    // Split identifiers by type
    const ids: string[] = []
    const logins: string[] = []
    for (const m of messages) {
      const body = JSON.parse(m.body)
      if (body?.type === 'id' && body?.value) ids.push(String(body.value))
      if (body?.type === 'login' && body?.value) logins.push(String(body.value))
    }

    console.log('twitch-live-checkQueue', 'handle', {
      ids,
      logins,
    })

    const api = new TwitchAPI(env)

    // Helper to chunk arrays to Twitch Helix limits (max 100)
    const chunk = <T>(arr: T[], size = 100) => {
      const out: T[][] = []
      for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size))
      return out
    }

    try {
      // Call Twitch API for provided identifiers
      const liveStreams: Array<TwitchStream> = []

      if (ids.length > 0) {
        for (const part of chunk(ids, 100)) {
          const resp = await api.fetchStreamsByUserIds(part)
          if (resp.data) {
            for (const s of resp.data) {
              // Only collect live streams
              if (s && s.type !== undefined) {
                liveStreams.push(s)
              }
            }
          }
        }
      }

      if (logins.length > 0) {
        for (const part of chunk(logins, 100)) {
          const resp = await api.fetchStreamsByLogins(part)
          if (resp.data) {
            for (const s of resp.data) {
              if (s && s.type !== undefined) {
                liveStreams.push(s)
              }
            }
          }
        }
      }

      // Build sets of current-batch affected identifiers
      const affectedIdsSet = new Set(ids.map((v) => String(v)))
      const affectedLoginsSet = new Set(
        logins.map((v) => String(v).toLowerCase()),
      )

      // Live sets from API response
      const liveIdsSet = new Set(liveStreams.map((s) => s.user_id))
      const liveLoginsSet = new Set(
        liveStreams.map((s) => String(s.user_login).toLowerCase()),
      )

      // Write back to JingleJamData DO by merging with existing arrays
      const DO = env.JingleJamData
      const stubID = DO.idFromName('JJ_API_CACHE')
      const stub = DO.get(stubID)

      const existingIds = await stub.getStringArray('twitch:liveStreams:ids')
      const existingLogins = await stub.getStringArray(
        'twitch:liveStreams:logins',
      )

      // Remove any entries for affected identifiers, then add the live ones from this batch
      const nextIds = existingIds
        .filter((id) => !affectedIdsSet.has(String(id)))
        .concat(Array.from(liveIdsSet))

      // For logins, do case-insensitive dedupe/replace
      const existingLoginsMap = new Map<string, string>()
      for (const l of existingLogins) existingLoginsMap.set(l.toLowerCase(), l)
      // Remove affected
      for (const l of affectedLoginsSet) existingLoginsMap.delete(l)
      // Add live from this batch (preserve lowercase as Twitch returns user_login lowercase)
      for (const l of liveLoginsSet) existingLoginsMap.set(l, l)
      const nextLogins = Array.from(existingLoginsMap.values())

      await stub.setStringArray(
        'twitch:liveStreams:ids',
        Array.from(new Set(nextIds)),
      )
      await stub.setStringArray('twitch:liveStreams:logins', nextLogins)

      // Persist live stream data to DB and clean up stale entries
      try {
        const db = getDB(env)

        // Upsert live streams
        if (liveStreams.length > 0) {
          const rows = liveStreams.map((s: any) => ({
            streamId: String(s.id),
            twitchId: String(s.user_id),
            userLogin: String(s.user_login),
            userName: String(s.user_name ?? ''),
            gameId: s.game_id ? String(s.game_id) : null,
            gameName: s.game_name ? String(s.game_name) : null,
            type: s.type ? String(s.type) : null,
            title: s.title ? String(s.title) : null,
            viewerCount:
              typeof s.viewer_count === 'number' ? s.viewer_count : null,
            startedAt: s.started_at ? String(s.started_at) : null,
            language: s.language ? String(s.language) : null,
            thumbnailUrl: s.thumbnail_url ? String(s.thumbnail_url) : null,
            tagIds: s.tag_ids ? JSON.stringify(s.tag_ids) : null,
            isMature: Boolean(s.is_mature ?? false),
          }))

          await db
            .insert(twitchStreamSchema)
            .values(rows)
            .onConflictDoUpdate({
              target: twitchStreamSchema.streamId,
              set: {
                twitchId: (twitchStreamSchema as any).twitchId,
                userLogin: (twitchStreamSchema as any).userLogin,
                userName: (twitchStreamSchema as any).userName,
                gameId: (twitchStreamSchema as any).gameId,
                gameName: (twitchStreamSchema as any).gameName,
                type: (twitchStreamSchema as any).type,
                title: (twitchStreamSchema as any).title,
                viewerCount: (twitchStreamSchema as any).viewerCount,
                startedAt: (twitchStreamSchema as any).startedAt,
                language: (twitchStreamSchema as any).language,
                thumbnailUrl: (twitchStreamSchema as any).thumbnailUrl,
                tagIds: (twitchStreamSchema as any).tagIds,
                isMature: (twitchStreamSchema as any).isMature,
              },
            })
        }

        // Delete streams for channels not live anymore within this batch
        const affectedIds = Array.from(affectedIdsSet)
        const affectedLogins = Array.from(affectedLoginsSet)
        const liveIds = Array.from(liveIdsSet)
        const liveLogins = Array.from(liveLoginsSet)

        if (affectedIds.length > 0) {
          if (liveIds.length > 0) {
            await db
              .delete(twitchStreamSchema)
              .where(
                and(
                  inArray(twitchStreamSchema.twitchId, affectedIds),
                  notInArray(twitchStreamSchema.twitchId, liveIds),
                ),
              )
          } else {
            await db
              .delete(twitchStreamSchema)
              .where(inArray(twitchStreamSchema.twitchId, affectedIds))
          }
        }

        if (affectedLogins.length > 0) {
          if (liveLogins.length > 0) {
            await db
              .delete(twitchStreamSchema)
              .where(
                and(
                  inArray(twitchStreamSchema.userLogin, affectedLogins),
                  notInArray(twitchStreamSchema.userLogin, liveLogins),
                ),
              )
          } else {
            await db
              .delete(twitchStreamSchema)
              .where(inArray(twitchStreamSchema.userLogin, affectedLogins))
          }
        }
      } catch (e) {
        console.error('twitch-live-checkQueue db persist error', e)
      }

      console.log('twitch-live-checkQueue', 'handle', {
        received: { ids: ids.length, logins: logins.length },
        liveFound: { ids: liveIdsSet.size, logins: liveLoginsSet.size },
      })
    } catch (e) {
      console.error('twitch-live-checkQueue handle error', e)
    } finally {
      batch.ackAll()
    }
  }
}

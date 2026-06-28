import { TwitchAPI } from '../../lib/twitchAPI.ts'
import type { TwitchUser } from '../../lib/model/TwitchUser.ts'
import {
  normalizeTwitchLogin,
  tiltifySlugToTwitchLoginMap,
} from '../utils/twitchLogins.ts'
import { chunk } from '../utils/chunk.ts'
import type { TiltifyStore } from './TiltifyStore.ts'

// Twitch login lifecycle: validation, live-stream polling and per-campaign live
// flags. Reads campaign/user data from the TiltifyStore.
//
// Owns storage keys: `twitch:id:*`, `twitch:login:*`, `strarr:twitch:*`,
// `campaign:live:*`.
export class TwitchTracker {
  constructor(
    private storage: DurableObjectStorage,
    private env: Env,
    private tiltify: TiltifyStore,
  ) {}

  // --- Generic string-array store (twitch:* arrays; also used by the live queue) ---
  public async setStringArray(name: string, values: string[]) {
    await this.storage.put(this.stringArrayKey(name), values)
  }

  public async getStringArray(name: string) {
    const values = await this.storage.get<string[]>(this.stringArrayKey(name))
    return values ?? []
  }

  public async getLiveLogins() {
    return this.getStringArray('twitch:liveStreams:logins')
  }

  public async validateTwitchChannels() {
    const api = new TwitchAPI(this.env)

    const logins = await this.tiltify.getAllTwitchLogins()

    const accessToken = await api.getAppToken()

    const invalidLogins: string[] = []

    const storedInvalidLogins = await this.getStringArray(
      'twitch:invalidLogins',
    )
    const storedValidLogins = await this.getStringArray('twitch:validLogins')
    // Normalize previously stored invalid logins for proper comparison
    const storedInvalidSet = new Set(storedInvalidLogins)
    const storedValidSet = new Set(storedValidLogins)

    const loginsToValidate = logins.filter((l) => !storedValidSet.has(l))
    const validLogins: string[] = [...storedValidSet]

    for (const login of loginsToValidate) {
      const normalized = normalizeTwitchLogin(login)
      if (!normalized) continue

      if (storedInvalidSet.has(normalized)) {
        invalidLogins.push(normalized)
        continue
      }

      const channel = await api.fetchUsersByLogin(normalized, accessToken)

      if (channel.data && !channel.error) {
        if (!validLogins.includes(normalized)) validLogins.push(normalized)

        await this.storage.put(`twitch:id:${channel.data.id}`, channel.data)
        await this.storage.put(
          `twitch:login:${channel.data.login}`,
          channel.data,
        )
      } else {
        if (channel.error.status !== 401) {
          if (!invalidLogins.includes(normalized))
            invalidLogins.push(normalized)
        }
      }
    }

    await this.setStringArray('twitch:validLogins', validLogins)
    await this.setStringArray('twitch:invalidLogins', invalidLogins)
  }

  public getTwitchChannelByChannelId(channelId: string) {
    return this.storage.get<TwitchUser>(`twitch:id:${channelId}`)
  }

  // Twitch user record keyed by login (read by the display builders)
  public getTwitchUserByLogin(login: string) {
    return this.storage.get<any>(`twitch:login:${login}`)
  }

  // Per-campaign live flag (read by the display builders)
  public getCampaignLive(userSlug: string) {
    return this.storage.get<boolean>(`campaign:live:${userSlug}`)
  }

  public async checkLiveStreams() {
    const logins = await this.getStringArray('twitch:validLogins')
    const api = new TwitchAPI(this.env)
    const accessToken = await api.getAppToken()
    const liveStreamsIds: string[] = []
    const liveStreamsLogins: string[] = []
    const loginChunks = chunk(logins, 50)
    for (const logins of loginChunks) {
      const stream = await api.fetchStreamsByLogins(logins, accessToken)
      if (stream.data && !stream.error) {
        for (const s of stream.data) {
          liveStreamsIds.push(s.user_id)
          liveStreamsLogins.push(s.user_login)
        }
      }
    }
    await this.setStringArray('twitch:liveStreams:ids', liveStreamsIds)
    await this.setStringArray('twitch:liveStreams:logins', liveStreamsLogins)

    // Update per-campaign live flags based on current live logins
    try {
      const liveSet = new Set(liveStreamsLogins.map((l) => l.toLowerCase()))
      const campaigns = await this.tiltify.getCampaigns()

      const users = await this.tiltify.getTiltifyUsersMap()
      const liveEntries: Record<string, boolean> = {}
      for (const c of campaigns) {
        const userSlug = c.user.slug
        const user = users.get(userSlug)
        const login =
          tiltifySlugToTwitchLoginMap.get(userSlug) ?? user?.social.twitch
        if (!login) continue
        const isLive = liveSet.has(normalizeTwitchLogin(login))
        liveEntries[`campaign:live:${c.user.slug}`] = isLive
      }
      await this.storage.put(liveEntries)
    } catch (e) {
      console.error('update campaign live flags', e)
    }
  }

  public getValidTwitchLogins() {
    return this.getStringArray('twitch:validLogins')
  }

  public getInvalidTwitchLogins() {
    return this.getStringArray('twitch:invalidLogins')
  }

  public async clearInvalidTwitchLogins() {
    await this.setStringArray('twitch:invalidLogins', [])
  }

  private stringArrayKey(name: string) {
    return `strarr:${name}`
  }
}

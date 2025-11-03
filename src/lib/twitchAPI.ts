import type {
  TokenData,
  TwitchAPIResult,
  TwitchStream,
  TwitchUser,
} from './model/TwitchAPIModel.ts'

export class TwitchAPI {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * Store a Twitch user object in KV for quick caching
   * - Saves under both login and id keys to allow retrieval by either
   * @param user Twitch user object from Helix API (snake_case fields)
   * @param ttlSeconds Time-to-live in seconds (default: 1 hour)
   */
  public async storeTwitchUser(
    user: TwitchUser,
    ttlSeconds: number = 60 * 60,
  ): Promise<void> {
    try {
      const byLoginKey = this.makeTwitchUserKeyByLogin(user.login)
      const byIdKey = this.makeTwitchUserKeyById(user.id)
      const payload = JSON.stringify(user)
      await this.env.KV.put(byLoginKey, payload, { expirationTtl: ttlSeconds })
      await this.env.KV.put(byIdKey, payload, { expirationTtl: ttlSeconds })
    } catch (error) {
      console.error('Error storing Twitch user in KV:', error)
    }
  }

  /**
   * Load a cached Twitch user by login
   * @param login Twitch login name
   * @returns The cached user or null if missing/not parseable
   */
  public async loadTwitchUserByLogin(
    login: string,
  ): Promise<TwitchUser | null> {
    if (!login) return null
    try {
      const raw = await this.env.KV.get(this.makeTwitchUserKeyByLogin(login))
      if (!raw) return null
      return JSON.parse(raw) as TwitchUser
    } catch (error) {
      console.error('Error loading Twitch user by login from KV:', error)
      return null
    }
  }

  /**
   * Load a cached Twitch user by id
   * @param id Twitch user id
   * @returns The cached user or null if missing/not parseable
   */
  public async loadTwitchUserById(id: string): Promise<TwitchUser | null> {
    if (!id) return null
    try {
      const raw = await this.env.KV.get(this.makeTwitchUserKeyById(id))
      if (!raw) return null
      return JSON.parse(raw) as TwitchUser
    } catch (error) {
      console.error('Error loading Twitch user by id from KV:', error)
      return null
    }
  }

  /**
   * Get app token with automatic caching and renewal
   * @returns Promise<string | undefined> - The access token or undefined if failed
   */
  public async getAppToken(): Promise<string | undefined> {
    // Check if we have a valid token in KV
    const cachedToken = await this.getTokenFromKV()
    if (cachedToken) {
      console.log('getAppToken', 'cachedToken', cachedToken)
      return cachedToken.access_token
    }

    // Get new token and store it
    const newToken = await this.getNewAppToken()
    if (!newToken) {
      return undefined
    }

    console.log('getAppToken', 'newToken', newToken)

    await this.storeToken(newToken)
    return newToken.access_token
  }

  /**
   * Fetch a Twitch channel by its ID
   * @param channelId - Twitch channel ID
   * @returns Promise with either the channel data or an error
   */
  public async fetchChannelById(
    channelId: string,
  ): Promise<TwitchAPIResult<TwitchUser>> {
    if (!channelId) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'Channel ID is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      const data = (await response.json()) as TwitchAPIResult<TwitchUser>
      return data
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Fetch a Twitch user by login name
   * @param login - Twitch login name
   * @returns Promise with either the user data or an error
   */
  public async fetchUserByLogin(
    login: string,
  ): Promise<TwitchAPIResult<TwitchUser[]>> {
    if (!login) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'Login name is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/users?login=${login}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      const data = (await response.json()) as TwitchAPIResult<TwitchUser[]>
      return data
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async fetchUserById(
    id: string,
  ): Promise<TwitchAPIResult<TwitchUser[]>> {
    if (!id) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'Login id is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/users?id=${id}`
      console.log('fetchUserById', 'url', url)
      const response = await this.makeAuthenticatedRequest(url)
      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      const data = (await response.json()) as TwitchAPIResult<TwitchUser[]>
      console.log('fetchUserById', 'data', data)
      return data
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async fetchUserByLoginWithCache(
    login: string,
  ): Promise<TwitchAPIResult<TwitchUser>> {
    const cachedUser = await this.loadTwitchUserByLogin(login)
    if (cachedUser) {
      return { data: cachedUser, error: null }
    }
    const result = await this.fetchUserByLogin(login)
    const user = result?.data?.[0]
    if (user) {
      await this.storeTwitchUser(user)
      return { data: user, error: null }
    }
    // Propagate API error or return 404 when empty
    return result.error
      ? { data: null, error: result.error }
      : { data: null, error: { status: 404, description: 'User not found' } }
  }

  public async fetchUserByIdWithCache(
    id: string,
  ): Promise<TwitchAPIResult<TwitchUser>> {
    const cachedUser = await this.loadTwitchUserById(id)
    if (cachedUser) {
      console.log('fetchUserByIdWithCache', 'cachedUser', cachedUser)
      return { data: cachedUser, error: null }
    }
    const result = await this.fetchUserById(id)
    console.log('fetchUserByIdWithCache', 'result', result)
    const user = result?.data?.[0]
    console.log('fetchUserByIdWithCache', 'user', user)
    if (user) {
      await this.storeTwitchUser(user)
      return { data: user, error: null }
    }
    // Propagate API error or return 404 when empty
    return result.error
      ? { data: null, error: result.error }
      : { data: null, error: { status: 404, description: 'User not found' } }
  }

  /**
   * Fetch multiple Twitch users by their login names
   * @param logins - Array of Twitch login names
   * @returns Promise with either the users data or an error
   */
  public async fetchUsersByLogins(
    logins: string[],
  ): Promise<TwitchAPIResult<TwitchUser[]>> {
    if (!logins || logins.length === 0) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'At least one login name is required',
        },
      }
    }

    try {
      const q = logins.join('&login=')
      const url = `https://api.twitch.tv/helix/users?login=${q}`
      console.log('fetchUsersByLogins', 'url', url)
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        console.log(
          'fetchUsersByLogins',
          'error response',
          await response.json(),
        )
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      return (await response.json()) as TwitchAPIResult<TwitchUser[]>
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async fetchUsersByLogin(
    login: string,
    accessToken?: string,
  ): Promise<TwitchAPIResult<TwitchUser>> {
    if (!login) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'At least one login name is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/users?login=${login}`
      console.log('fetchUsersByLogins', 'url', url)
      const response = await this.makeAuthenticatedRequest(url, accessToken)

      if (!response.ok) {
        console.log(
          'fetchUsersByLogins',
          'error response',
          await response.json(),
        )
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      const resp = (await response.json()) as TwitchAPIResult<TwitchUser[]>
      if (!resp.data || resp.data.length === 0) {
        return {
          data: null,
          error: {
            status: 404,
            description: 'User not found',
          },
        }
      }
      return {
        data: resp.data![0],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Fetch streams for a specific user
   * @param userId - Twitch user ID
   * @returns Promise with either the stream data or an error
   */
  public async fetchStreamsByUserId(
    userId: string,
  ): Promise<TwitchAPIResult<TwitchStream[]>> {
    if (!userId) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'User ID is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/streams?user_id=${userId}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      return (await response.json()) as TwitchAPIResult<TwitchStream[]>
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async fetchStreamsByLogin(
    login: string,
    accessToken?: string,
  ): Promise<TwitchAPIResult<TwitchStream>> {
    if (!login) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'User login is required',
        },
      }
    }

    try {
      const url = `https://api.twitch.tv/helix/streams?user_login=${login}`

      const response = await this.makeAuthenticatedRequest(url, accessToken)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      const resp = (await response.json()) as TwitchAPIResult<TwitchStream[]>
      if (!resp.data || resp.data.length === 0) {
        return {
          data: null,
          error: {
            status: 200,
            description: 'Stream not found',
          },
        }
      }
      return {
        data: resp.data![0],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Fetch streams for multiple users
   * @param userIds - Array of Twitch user IDs
   * @returns Promise with either the stream data or an error
   */
  public async fetchStreamsByUserIds(
    userIds: string[],
  ): Promise<TwitchAPIResult<TwitchStream[]>> {
    if (!userIds || userIds.length === 0) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'At least one user ID is required',
        },
      }
    }

    try {
      const q = userIds.join('&user_id=')
      const url = `https://api.twitch.tv/helix/streams?user_id=${q}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      return (await response.json()) as TwitchAPIResult<TwitchStream[]>
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async fetchStreamsByLogins(
    logins: string[],
  ): Promise<TwitchAPIResult<TwitchStream[]>> {
    if (!logins || logins.length === 0) {
      return {
        data: null,
        error: {
          status: 400,
          description: 'At least one logni is required',
        },
      }
    }

    try {
      const q = logins.join('&user_login=')
      const url = `https://api.twitch.tv/helix/streams?user_login=${q}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`,
          },
        }
      }

      return (await response.json()) as TwitchAPIResult<TwitchStream[]>
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Fetch Twitch data by channel ID (legacy method for compatibility)
   * @param channelId - Twitch channel ID
   * @param accessToken - Optional access token
   * @returns Promise with channel data
   */
  public async getTwitchData(channelId: string, accessToken?: string) {
    const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`
    const response = await this.makeAuthenticatedRequest(url, accessToken)
    return response.json()
  }

  /**
   * Fetch Twitch data by login (legacy method for compatibility)
   * @param login - Twitch login name
   * @param accessToken - Optional access token
   * @returns Promise with channel data
   */
  public async getTwitchDataByLogin(login: string, accessToken?: string) {
    const url = `https://api.twitch.tv/helix/channels?login=${login}`
    const response = await this.makeAuthenticatedRequest(url, accessToken)
    return response.json()
  }

  /**
   * Fetch Twitch data by multiple logins (legacy method for compatibility)
   * @param logins - Array of Twitch login names
   * @param accessToken - Optional access token
   * @returns Promise with user data
   */
  public async getTwitchDataByLogins(
    logins: string[],
    accessToken?: string,
  ): Promise<TwitchUser[]> {
    const q = logins.join('&login=')
    const url = `https://api.twitch.tv/helix/users?login=${q}`
    const response = await this.makeAuthenticatedRequest(url, accessToken)
    return response.json()
  }

  // --- TwitchUser KV helpers ---
  private makeTwitchUserKeyByLogin(login: string) {
    return `twitch:user:login:${login}`
  }

  private makeTwitchUserKeyById(id: string) {
    return `twitch:user:id:${id}`
  }

  /**
   * Get a new app token from Twitch API
   * @returns Promise<TokenData | null>
   */
  private async getNewAppToken(): Promise<TokenData | null> {
    try {
      const url =
        'https://id.twitch.tv/oauth2/token?' +
        'client_id=' +
        this.env.TWITCH_CLIENT_ID +
        '&client_secret=' +
        this.env.TWITCH_CLIENT_SECRET +
        '&grant_type=client_credentials'

      const response = await fetch(url, { method: 'POST' })

      if (!response.ok) {
        console.error('getNewAppToken', response)
        return null
      }
      const body = await response.json()
      console.log('getNewAppToken', 'response', body)
      return body as TokenData
    } catch (error) {
      console.error('Error fetching new Twitch app token:', error)
      return null
    }
  }

  /**
   * Store token in KV with appropriate TTL
   * @param tokenData - The token data to store
   */
  private async storeToken(tokenData: TokenData): Promise<void> {
    try {
      const expirationTtl = Number((tokenData.expires_in / 1000).toFixed(0))
      console.log('storeToken', 'tokenData', tokenData, expirationTtl)
      await this.env.KV.put('twitch:app_token', JSON.stringify(tokenData), {
        expirationTtl: expirationTtl,
      })
    } catch (error) {
      console.error('Error storing Twitch token in KV:', error)
    }
  }

  /**
   * Get token from KV storage
   * @returns Promise<TokenData | null>
   */
  private async getTokenFromKV(): Promise<TokenData | null> {
    try {
      const tokenString = await this.env.KV.get('twitch:app_token')
      if (!tokenString) {
        return null
      }
      return JSON.parse(tokenString) as TokenData
    } catch (error) {
      console.error('Error getting Twitch token from KV:', error)
      return null
    }
  }

  /**
   * Make authenticated request to Twitch API
   * @param url - API endpoint URL
   * @param accessToken - Optional access token (will get app token if not provided)
   * @returns Promise<Response>
   */
  private async makeAuthenticatedRequest(
    url: string,
    accessToken?: string,
  ): Promise<Response> {
    if (!accessToken) {
      accessToken = await this.getAppToken()
      if (!accessToken) {
        throw new Error('Failed to get Twitch access token')
      }
    }

    const headers = {
      Authorization: 'Bearer ' + accessToken,
      'Client-Id': this.env.TWITCH_CLIENT_ID,
    }

    return fetch(url, { headers })
  }
}

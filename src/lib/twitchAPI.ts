import type {
  StreamResult,
  TokenData,
  TwitchAPIResult,
  UserResult,
} from './model/TwitchAPIModel.ts'

export class TwitchAPI {
  private env: Env

  constructor(env: Env) {
    this.env = env
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
  ): Promise<TwitchAPIResult<any>> {
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

      const data = await response.json()
      return { data, error: null }
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
  ): Promise<TwitchAPIResult<UserResult>> {
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

      const data = (await response.json()) as UserResult
      return { data, error: null }
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
   * Fetch multiple Twitch users by their login names
   * @param logins - Array of Twitch login names
   * @returns Promise with either the users data or an error
   */
  public async fetchUsersByLogins(
    logins: string[],
  ): Promise<TwitchAPIResult<UserResult>> {
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

      const data = (await response.json()) as UserResult
      return { data, error: null }
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
  ): Promise<TwitchAPIResult<StreamResult>> {
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

      const data = (await response.json()) as StreamResult
      return { data, error: null }
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
  ): Promise<TwitchAPIResult<StreamResult>> {
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

      const data = (await response.json()) as StreamResult
      return { data, error: null }
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
  ): Promise<UserResult> {
    const q = logins.join('&login=')
    const url = `https://api.twitch.tv/helix/users?login=${q}`
    const response = await this.makeAuthenticatedRequest(url, accessToken)
    return response.json()
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
      await this.env.KV.put('twitch_app_token', JSON.stringify(tokenData), {
        expirationTtl: tokenData.expires_in,
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
      const tokenString = await this.env.KV.get('twitch_app_token')
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

import {DurableObject} from "cloudflare:workers";
import type {TokenData, TwitchUser, UserResult, StreamResult, TwitchAPIResult} from "../lib/model/TwitchAPIModel.ts";


export class TwitchAPIDO extends DurableObject<Env> {

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * get token from twitch
   * @return {Promise}
   */
  private async getToken(): Promise<TokenData> {
    const url = "https://id.twitch.tv/oauth2/token?" +
      "client_id=" + this.env.TWITCH_CLIENT_ID +
      "&client_secret=" + this.env.TWITCH_CLIENT_SECRET +
      "&grant_type=client_credentials";
    console.log(url)
    return fetch(url, {method: "POST"}).then(res => res.json())
  }

  private storeToken(tokenData: TokenData){
    return this.env.KV.put("token", JSON.stringify(tokenData), {
      expirationTtl: tokenData.expires_in
    });
  }

  private async refreshToken() {
    const tokenData: TokenData = await this.getToken();
    await this.env.KV.put("token", JSON.stringify(tokenData), {
      expirationTtl: tokenData.expires_in
    });
  }

  private getLocalToken(): Promise<TokenData | null> {
    return this.env.KV.get<TokenData>('token')
  }

  private async getTokenAndStore(): Promise<TokenData> {
    /*
    const token = await this.env.KV.get<TokenData>('token')
    if (!token) {
      const tokenData: TokenData = await this.getToken();
      await this.storeToken(tokenData);
      console.log('getTokenAndStore', tokenData)
      return tokenData;
    }*/

    const token = await this.getToken();
    console.log('getTokenAndStore', token)
    return token
  }

  private async getTwitchData(channelId: string, access_token?: string) {
    if (!access_token) {
      const reps = await this.getTokenAndStore()
      access_token = reps.access_token
    }

    const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`
    const headers = {
      "Authorization": "Bearer " + access_token,
      "Client-Id": this.env.TWITCH_CLIENT_ID,
    }
    return fetch(url, {headers}).then(res => res.json())
  }

  private async getTwitchDataByLogin(login: string, access_token?: string) {
    if (!access_token) {
      const reps = await this.getTokenAndStore()
      access_token = reps.access_token
    }
    const url = `https://api.twitch.tv/helix/channels?login=${login}`
    const headers = {
      "Authorization": "Bearer " + access_token,
      "Client-Id": this.env.TWITCH_CLIENT_ID,
    }
    return fetch(url, {headers}).then(res => res.json())
  }

  private async getTwitchDataByLogins(logins: string[], access_token?: string): Promise<UserResult> {
    if (!access_token) {
      const reps = await this.getTokenAndStore()
      access_token = reps.access_token
    }
    const q = logins.join('&login=')
    const url = `https://api.twitch.tv/helix/users?login=${q}`
    const headers = {
      "Authorization": "Bearer " + access_token,
      "Client-Id": this.env.TWITCH_CLIENT_ID,
    }
    return fetch(url, {headers}).then(res => res.json())
  }

  /**
   * Fetch a Twitch channel by its ID
   * @param channelId - Twitch channel ID
   * @returns Promise with either the channel data or an error
   */
  public async fetchChannelById(channelId: string): Promise<TwitchAPIResult<any>> {
    if (!channelId) {
      return {
        data: null,
        error: {
          status: 400,
          description: "Channel ID is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();
      const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`;
      const headers = {
        "Authorization": "Bearer " + token.access_token,
        "Client-Id": this.env.TWITCH_CLIENT_ID,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`
          }
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Fetch a Twitch user by login name
   * @param login - Twitch login name
   * @returns Promise with either the user data or an error
   */
  public async fetchUserByLogin(login: string): Promise<TwitchAPIResult<UserResult>> {
    if (!login) {
      return {
        data: null,
        error: {
          status: 400,
          description: "Login name is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();
      console.log('token', token);
      const url = `https://api.twitch.tv/helix/users?login=${login}`;
      const headers = {
        "Authorization": "Bearer " + token.access_token,
        "Client-Id": this.env.TWITCH_CLIENT_ID,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`
          }
        };
      }

      const data = await response.json() as UserResult;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Fetch multiple Twitch users by their login names
   * @param logins - Array of Twitch login names
   * @returns Promise with either the users data or an error
   */
  public async fetchUsersByLogins(logins: string[]): Promise<TwitchAPIResult<UserResult>> {
    if (!logins || logins.length === 0) {
      return {
        data: null,
        error: {
          status: 400,
          description: "At least one login name is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();
      const q = logins.join('&login=');
      const url = `https://api.twitch.tv/helix/users?login=${q}`;
      const headers = {
        "Authorization": "Bearer " + token.access_token,
        "Client-Id": this.env.TWITCH_CLIENT_ID,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`
          }
        };
      }

      const data = await response.json() as UserResult;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Fetch streams for a specific user
   * @param userId - Twitch user ID
   * @returns Promise with either the stream data or an error
   */
  public async fetchStreamsByUserId(userId: string): Promise<TwitchAPIResult<StreamResult>> {
    if (!userId) {
      return {
        data: null,
        error: {
          status: 400,
          description: "User ID is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();
      const url = `https://api.twitch.tv/helix/streams?user_id=${userId}`;
      const headers = {
        "Authorization": "Bearer " + token.access_token,
        "Client-Id": this.env.TWITCH_CLIENT_ID,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`
          }
        };
      }

      const data = await response.json() as StreamResult;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Fetch streams for a specific streams
   * @param userIds - Twitch user ID
   * @returns Promise with either the stream data or an error
   */
  public async fetchStreamsByUserIds(userIds: string[]): Promise<TwitchAPIResult<StreamResult>> {
    if (!userIds) {
      return {
        data: null,
        error: {
          status: 400,
          description: "User ID is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();

      const q = userIds.join('&user_id=')
      const url = `https://api.twitch.tv/helix/streams?user_id=${q}`
      const headers = {
        "Authorization": "Bearer " + token.access_token,
        "Client-Id": this.env.TWITCH_CLIENT_ID,
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            description: `Twitch API error: ${response.statusText}`
          }
        };
      }

      const data = await response.json() as StreamResult;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          description: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  public refresh(login: string) {
    // Implementation can be added later
  }

  private writeToDB(user: TwitchUser) {
    // Implementation can be added later
  }
}

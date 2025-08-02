import type {ActionAPIContext} from "astro:actions";
import type {RepoEnv} from "../db/repos/BaseRepo.ts";
import type {TokenData, TwitchUser, UserResult, StreamResult, TwitchAPIResult} from "../model/TwitchAPIModel.ts";
import {BaseWebService} from "./BaseWebService.ts";

/**
 * Service for Twitch API operations
 */
export class TwitchWebService extends BaseWebService {
  /**
   * Creates a new TwitchAPIService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Creates a TwitchAPIService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TwitchAPIService instance
   */
  static action(ctx: ActionAPIContext) {
    return new TwitchWebService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Get token from Twitch
   * @returns Promise with token data
   * @private
   */
  private async getToken(): Promise<TokenData> {
    const url = "https://id.twitch.tv/oauth2/token?" +
      "client_id=" + this.env.TWITCH_CLIENT_ID +
      "&client_secret=" + this.env.TWITCH_CLIENT_SECRET +
      "&grant_type=client_credentials";

    try {
      const response = await fetch(url, {method: "POST"});
      return await response.json();
    } catch (error) {
      this.handleError("Failed to get Twitch token", error);
    }
  }

  /**
   * Store token in KV store
   * @param tokenData - The token data to store
   * @private
   */
  private async storeToken(tokenData: TokenData) {
    try {
      await this.env.KV.put("token", JSON.stringify(tokenData), {
        expirationTtl: tokenData.expires_in
      });
    } catch (error) {
      this.handleError("Failed to store Twitch token", error);
    }
  }

  /**
   * Refresh the Twitch token
   * @private
   */
  private async refreshToken() {
    try {
      const tokenData: TokenData = await this.getToken();
      await this.storeToken(tokenData);
    } catch (error) {
      this.handleError("Failed to refresh Twitch token", error);
    }
  }

  /**
   * Get token from KV store
   * @returns Promise with token data or null
   * @private
   */
  private async getLocalToken(): Promise<TokenData | null> {
    try {
      return await this.env.KV.get<TokenData>('token');
    } catch (error) {
      this.handleError("Failed to get local Twitch token", error);
    }
  }

  /**
   * Get token and store it if needed
   * @returns Promise with token data
   * @private
   */
  private async getTokenAndStore(): Promise<TokenData> {
    try {
      const token = await this.getToken();
      await this.storeToken(token);
      return token;
    } catch (error) {
      this.handleError("Failed to get and store Twitch token", error);
    }
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
   * Fetch streams for multiple users
   * @param userIds - Array of Twitch user IDs
   * @returns Promise with either the stream data or an error
   */
  public async fetchStreamsByUserIds(userIds: string[]): Promise<TwitchAPIResult<StreamResult>> {
    if (!userIds || userIds.length === 0) {
      return {
        data: null,
        error: {
          status: 400,
          description: "At least one user ID is required"
        }
      };
    }

    try {
      const token = await this.getTokenAndStore();
      const q = userIds.join('&user_id=');
      const url = `https://api.twitch.tv/helix/streams?user_id=${q}`;
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
}

import type {ActionAPIContext} from "astro:actions";
import type {
  AllCampaignsResponse,
  TiltifyAPIResult,
  TiltifyToken,
  TiltifyUserCampaigns,
  TiltifyUserCampaignsResponse,
  TiltifyUserData
} from "../model/TiltifyAPIModel.ts";
import {BaseWebService} from "./BaseWebService.ts";
import {DateTime} from "luxon";
import {and, eq, type InferSelectModel} from "drizzle-orm";
import {drizzle} from "drizzle-orm/d1";
import {tokens} from "../db/schema/auth-schema.ts";
import {TiltifyTokenCache} from "../db/cache/TiltifyTokenCache.ts";
import type {AstroContext} from "../AstroContext.ts";
import {TiltifyRepo} from "../db/repos/tiltify/TiltifyRepo.ts";
import type {RepoEnv} from "../db/RepoEnv.ts";

/**
 * Service for Tiltify API operations
 */
export class TiltifyWebService extends BaseWebService {
  private tokenCache: TiltifyTokenCache;
  private tiltifyRepo: TiltifyRepo;

  /**
   * Creates a new TiltifyWebService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.tokenCache = new TiltifyTokenCache(env);
    this.tiltifyRepo = new TiltifyRepo(env, repoEnv);
  }

  /**
   * Creates a TiltifyWebService instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A TiltifyWebService instance
   */
  static action(ctx: ActionAPIContext) {
    return new TiltifyWebService(ctx.locals.runtime.env, 'action');
  }

  /**
   * Saves a token to the database
   * @param userId - The user ID to save the token for
   * @param token - The token to save
   * @returns Promise with the saved token
   */
  async saveTokenToDB(userId: number, token: TiltifyToken) {
    try {
      const db = drizzle(this.env.DB);
      return db.insert(tokens)
        .values({
          userId: userId,
          provider: 'tiltify',
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: new Date(Date.now() + token.expiresIn * 1000)
        })
        .onConflictDoUpdate({
          target: [tokens.userId, tokens.provider],
          set: {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresAt: new Date(Date.now() + token.expiresIn * 1000)
          }
        })
        .returning();
    } catch (error) {
      this.handleError("Failed to save Tiltify token to DB", error);
    }
  }

  /**
   * Gets a token from the database
   * @param userId - The user ID to get the token for
   * @returns Promise with the token or undefined
   */
  async getTokenFromDB(userId: number) {
    try {
      const db = drizzle(this.env.DB);
      return db.select()
        .from(tokens)
        .where(and(eq(tokens.userId, userId), eq(tokens.provider, 'tiltify')))
        .get();
    } catch (error) {
      this.handleError("Failed to get Tiltify token from DB", error);
    }
  }

  /**
   * Checks if a token is valid
   * @param token - The token to check
   * @returns True if the token is valid
   */
  isTokenValid(token: InferSelectModel<typeof tokens>): boolean {
    const now = DateTime.now();
    const expiresAt = DateTime.fromJSDate(token.expiresAt);
    return (now < expiresAt);
  }

  /**
   * Gets a token from an authorization code
   * @param ctx - The API context
   * @returns Promise with token data or null
   */
  async getTokenFromCode(ctx: AstroContext): Promise<TiltifyToken | null> {
    try {
      const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID;
      const TILTIFY_SECRET = this.env.TILTIFY_SECRET;
      const url = new URL(ctx.request.url);
      const code = url.searchParams.get("code");
      const redirectUri = new URL("/api/auth/tiltify/callback/", ctx.request.url);

      const body = {
        grant_type: "authorization_code",
        client_id: TILTIFY_CLIENT_ID,
        client_secret: TILTIFY_SECRET,
        redirect_uri: redirectUri.toString(),
        code: code
      };

      const tokenRes = await fetch("https://v5api.tiltify.com/oauth/token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      if (!tokenRes.ok) {
        return null;
      } else {
        const token: any = await tokenRes.json();
        return {
          accessToken: token.access_token,
          createdAt: token.created_at,
          expiresIn: token.expires_in,
          refreshToken: token.refresh_token,
          scope: token.scope,
          tokenType: token.token_type,
        };
      }
    } catch (error) {
      this.handleError("Failed to get Tiltify token from code", error);
      return null;
    }
  }

  /**
   * Gets a token from the context
   * @param ctx - The Astro context
   * @returns Promise with the token or null
   */
  async getTokenFromContext(ctx: AstroContext): Promise<string | null> {
    try {
      const {session, user} = ctx.locals;
      if (!session || !user) {
        return null;
      }

      const tokenFromCache = await this.tokenCache.getToken(session.id);

      if (tokenFromCache) {
        return tokenFromCache;
      }

      const tokenFromDB = await this.getTokenFromDB(user.id);

      if (!tokenFromDB) {
        return null;
      }

      if (this.isTokenValid(tokenFromDB)) {
        await this.tokenCache.storeTokenFromDB(session.id, tokenFromDB);
        return tokenFromDB.accessToken;
      }

      const tiltifyToken = await this.getNewToken(tokenFromDB.refreshToken);

      if (!tiltifyToken) {
        return null;
      }

      await this.saveTokenToDB(user.id, tiltifyToken);
      await this.tokenCache.storeToken(session.id, tiltifyToken);

      return tiltifyToken.accessToken;
    } catch (error) {
      this.handleError("Failed to get Tiltify token from context", error);
      return null;
    }
  }

  /**
   * Gets the current user from Tiltify
   * @param accessToken - The access token to use
   * @returns Promise with the user data or null
   */
  async getUser(accessToken: string): Promise<TiltifyAPIResult<TiltifyUserData>> {
    try {
      const response = await fetch("https://v5api.tiltify.com/api/public/current-user", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          data: null,
          error: {
            status: response.status,
            message: `Tiltify API error: ${response.statusText}`,
            fields: null
          }
        };
      }

      const data = (await response.json()) as any;
      return {data, error: null};
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          message: error instanceof Error ? error.message : "Unknown error",
          fields: null
        }
      };
    }
  }

  /**
   * Gets an app token
   * @returns Promise with the token or null
   */
  async getAppToken(): Promise<string | null> {
    try {
      const tokenFromCache = await this.tokenCache.getToken('APP_TOKEN');
      this.log('getAppToken', 'tokenFromCache', tokenFromCache);

      if (tokenFromCache) {
        return tokenFromCache;
      }

      const token = await this.getNewAppToken();
      this.log('getAppToken', 'token', token);

      if (!token) {
        return null;
      }

      await this.tokenCache.storeToken('APP_TOKEN', token);
      return token.accessToken;
    } catch (error) {
      this.handleError("Failed to get Tiltify app token", error);
      return null;
    }
  }

  /**
   * Gets campaigns by user
   * @param tiltifyId - The Tiltify user ID
   * @returns Promise with the campaigns or an error
   */
  async getCampaignsByUser(tiltifyId: string): Promise<TiltifyUserCampaignsResponse> {
    try {
      const resp = await fetch(`https://v5api.tiltify.com/api/public/users/${tiltifyId}/campaigns?updated_after=2024-10-01T00:00:00.000000Z`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!resp.ok) {
        const errorResponse = (await resp.json()) as any;
        return {
          data: null,
          error: errorResponse.error,
        };
      }

      const dataResponse = (await resp.json()) as any;
      return {
        data: dataResponse,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          fields: null,
          status: 500
        }
      };
    }
  }

  /**
   * Gets all campaigns
   * @returns Promise with all campaigns or an error
   */
  async getAllCampaigns(): Promise<AllCampaignsResponse> {
    try {
      const token = await this.getAppToken();
      if (!token) {
        return {
          data: null,
          error: {
            message: 'No token found',
            fields: null,
            status: 401
          }
        };
      }

      const accounts = await this.tiltifyRepo.findAll();
      const tiltifyIds = accounts.map(account => account.providerId);
      const userDataResp = await Promise.all(tiltifyIds.map(id => this.getCampaignsByUser(id)));
      const userData = userDataResp
        .map((resp) => resp.data)
        .filter((data) => data !== null) as TiltifyUserCampaigns[];

      return {
        data: userData,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          fields: null,
          status: 500
        }
      };
    }
  }

  /**
   * Gets a new token from Tiltify using a refresh token
   * @param refreshToken - The refresh token to use
   * @returns Promise with token data or null
   * @private
   */
  private async getNewToken(refreshToken: string): Promise<TiltifyToken | null> {
    try {
      const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID;
      const TILTIFY_SECRET = this.env.TILTIFY_SECRET;

      const body = {
        "client_id": TILTIFY_CLIENT_ID,
        "client_secret": TILTIFY_SECRET,
        "refresh_token": refreshToken,
        "grant_type": "refresh_token"
      };

      const refreshResponse = await fetch('https://v5api.tiltify.com/oauth/token', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });

      if (!refreshResponse.ok) {
        return null;
      }

      const response = (await refreshResponse.json()) as any;
      return {
        accessToken: response.access_token,
        createdAt: response.created_at,
        expiresIn: response.expires_in,
        refreshToken: response.refresh_token,
        scope: response.scope,
        tokenType: response.token_type,
      };
    } catch (error) {
      this.handleError("Failed to get new Tiltify token", error);
      return null;
    }
  }

  /**
   * Gets a new app token
   * @returns Promise with token data or null
   * @private
   */
  private async getNewAppToken(): Promise<TiltifyToken | null> {
    try {
      const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID;
      const TILTIFY_SECRET = this.env.TILTIFY_SECRET;

      const tokenRes = await fetch(`https://v5api.tiltify.com/oauth/token?client_id=${TILTIFY_CLIENT_ID}&client_secret=${TILTIFY_SECRET}&grant_type=client_credentials`, {
        method: 'POST',
        headers: {"Content-Type": "application/json", 'Accept': 'application/json'},
      });

      if (!tokenRes.ok) {
        this.error('getNewAppToken error:', await tokenRes.json());
        this.error('getNewAppToken error:', tokenRes);
        return null;
      } else {
        const token: any = await tokenRes.json();
        return {
          accessToken: token.access_token as string,
          createdAt: token.created_at as string,
          refreshToken: '',
          expiresIn: token.expires_in as number,
          scope: token.scope as string,
          tokenType: token.token_type as string,
        };
      }
    } catch (error) {
      this.handleError("Failed to get new Tiltify app token", error);
      return null;
    }
  }
}

import type { APIContext } from 'astro'
import type { AstroContext } from './AstroContext.ts'
import { DateTime } from 'luxon'
import { tokens } from './db/schema/auth-schema.ts'
import { and, eq, type InferSelectModel } from 'drizzle-orm'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import { TiltifyTokenCache } from './db/cache/TiltifyTokenCache.ts'

export type TiltifyToken = {
  accessToken: string
  createdAt: string
  expiresIn: number
  refreshToken: string
  scope: string
  tokenType: string
}

export type RawTiltifyToken = {
  access_token: string
  created_at: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: string
}

// Define types for the Tiltify user response
export interface TiltifyImage {
  alt: string
  height: number
  src: string
  width: number
}

export interface TiltifySocial {
  discord?: string
  facebook?: string
  instagram?: string
  snapchat?: string
  tiktok?: string
  twitch?: string
  twitter?: string
  website?: string
  youtube?: string
}

export interface TiltifyMonetaryValue {
  currency: string
  value: string
}

export interface TiltifyUserData {
  avatar: TiltifyImage
  description: string
  id: string
  legacy_id: number
  slug: string
  social: TiltifySocial
  total_amount_raised: TiltifyMonetaryValue
  url: string
  username: string
}

export interface TiltifyUserResponse {
  data: TiltifyUserData
}

export interface TiltifyCampaignAvatar {
  alt: string
  height: number
  src: string
  width: number
}

export interface TiltifyCampaignSocial {
  discord?: string
  facebook?: string
  instagram?: string
  snapchat?: string
  tiktok?: string
  twitch?: string
  twitter?: string
  website?: string
  youtube?: string
}

export interface TiltifyCampaignTotalAmountRaised {
  currency: string
  value: string
}

export interface TiltifyCampaignData {
  avatar: TiltifyCampaignAvatar
  description: string
  id: string
  legacy_id: number
  name: string
  slug: string
  social: TiltifyCampaignSocial
  total_amount_raised: TiltifyCampaignTotalAmountRaised
  url: string
}

export interface TiltifyCampaignMetadata {
  after: string | null
  before: string | null
  limit: number
}

export interface TiltifyCampaignsResponse {
  data: TiltifyCampaignData[]
  metadata: TiltifyCampaignMetadata
}

export interface TiltifyErrorFields {
  [key: string]: string[]
}

export interface TiltifyError {
  fields: TiltifyErrorFields | null
  message: string
  status: number
}

export interface TiltifyErrorResponse {
  error: TiltifyError
}

export class TiltifyAPI {
  private env: Env
  private db: DrizzleD1Database
  private tokenCache: TiltifyTokenCache

  constructor(env: Env) {
    this.env = env
    this.db = drizzle(env.DB)
    this.tokenCache = new TiltifyTokenCache(env)
  }

  async saveTokenToDB(userId: number, token: TiltifyToken) {
    console.log('saveTokenToDB', userId, token)
    return this.db
      .insert(tokens)
      .values({
        userId: userId,
        provider: 'tiltify',
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: new Date(Date.now() + token.expiresIn * 1000),
      })
      .onConflictDoUpdate({
        target: [tokens.userId, tokens.provider],
        set: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: new Date(Date.now() + token.expiresIn * 1000),
        },
      })
      .returning()
  }

  getTokenFromDB(userId: number) {
    return this.db
      .select()
      .from(tokens)
      .where(and(eq(tokens.userId, userId), eq(tokens.provider, 'tiltify')))
      .get()
  }

  isTokenValid(token: InferSelectModel<typeof tokens>): boolean {
    const now = DateTime.now()
    const expiresAt = DateTime.fromJSDate(token.expiresAt)
    return now < expiresAt
  }

  /**
   * Gets a Tiltify token from an authorization code
   * @example
   * {
   *   "access_token": "ab6a592346444dea97170837e104d8a5ab6a592346444dea97170837e104d8a5",
   *   "created_at": "2023-01-27T19:32:03Z",
   *   "expires_in": 7200,
   *   "refresh_token": "njjjytm3otetmgrjmi00yjawlwe4zgytzjixy2mzm2y3njawcg121231999393a3",
   *   "scope": "public",
   *   "token_type": "bearer"
   * }
   */
  async getTokenFromCode(ctx: APIContext): Promise<TiltifyToken | null> {
    const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID
    const TILTIFY_SECRET = this.env.TILTIFY_SECRET
    const url = new URL(ctx.request.url)
    const code = url.searchParams.get('code')
    const redirectUri = new URL('/api/auth/tiltify/callback/', ctx.request.url)
    const body = {
      grant_type: 'authorization_code',
      client_id: TILTIFY_CLIENT_ID,
      client_secret: TILTIFY_SECRET,
      redirect_uri: redirectUri.toString(),
      code: code,
    }
    const tokenRes = await fetch('https://v5api.tiltify.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!tokenRes.ok) {
      return null
    } else {
      const token: any = await tokenRes.json()
      return {
        accessToken: token.access_token,
        createdAt: token.created_at,
        expiresIn: token.expires_in,
        refreshToken: token.refresh_token,
        scope: token.scope,
        tokenType: token.token_type,
      }
    }
  }

  async getTokenFromContext(ctx: AstroContext): Promise<string | null> {
    return this.getTokenFromLocals(ctx.locals)
  }

  async getTokenFromLocals(locals: App.Locals): Promise<string | null> {
    const { session, user } = locals
    if (!session || !user) {
      return null
    }

    const tokenFromCache = await this.tokenCache.getToken(session.id)

    if (tokenFromCache) {
      return tokenFromCache
    }

    const tokenFromDB = await this.getTokenFromDB(user.id)
    console.log('tokenFromDB', tokenFromDB)
    if (!tokenFromDB) {
      return null
    }

    if (this.isTokenValid(tokenFromDB)) {
      await this.tokenCache.storeTokenFromDB(session.id, tokenFromDB)
      return tokenFromDB.accessToken
    }

    const tiltifyToken = await this.getNewToken(tokenFromDB.refreshToken)

    console.log('tiltifyToken', tiltifyToken)

    if (!tiltifyToken) {
      return null
    }

    await this.saveTokenToDB(user.id, tiltifyToken)
    await this.tokenCache.storeToken(session.id, tiltifyToken)

    return tiltifyToken.accessToken
  }

  /**
   * Calls: https://v5api.tiltify.com/api/public/current-user
   * @example
   * {
   *   "data": {
   *     "avatar": {
   *       "alt": "Short image description used as alternative text.",
   *       "height": 200,
   *       "src": "https://tiltify.com/images/example.jpg",
   *       "width": 200
   *     },
   *     "description": "Professional twitch streamer who likes charity!",
   *     "id": "be0e3b3c-133c-4276-a3c0-7c9af6a32c0f",
   *     "legacy_id": 666497957,
   *     "slug": "username",
   *     "social": {
   *       "discord": "https://discord.gg/tiltify",
   *       "facebook": "tiltify",
   *       "instagram": "tiltify",
   *       "snapchat": "tiltify",
   *       "tiktok": "tilitfy",
   *       "twitch": "tilitfy",
   *       "twitter": "tiltify",
   *       "website": "https://tiltify.com",
   *       "youtube": "UCWcPgWbuWuJX5rHWm6Kb4Vw"
   *     },
   *     "total_amount_raised": {
   *       "currency": "USD",
   *       "value": "182.32"
   *     },
   *     "url": "https://tiltify.com/@username",
   *     "username": "UserName"
   *   }
   * }
   */
  async getUser(accessToken: string): Promise<TiltifyUserResponse | null> {
    try {
      const response = await fetch(
        'https://v5api.tiltify.com/api/public/current-user',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        console.error('getTiltifyUser error:', await response.json())
        return null
      }

      return response.json()
    } catch (error) {
      console.error('Error fetching Tiltify user:', error)
      return null
    }
  }

  async getAppToken() {
    const tokenFromCache = await this.tokenCache.getToken('APP_TOKEN')
    if (tokenFromCache) {
      return tokenFromCache
    }

    const token = await this.getNewAppToken()

    if (!token) {
      return null
    }

    await this.tokenCache.storeToken('APP_TOKEN', token)

    return token.accessToken
  }

  async getCampaignsByUser(
    tiltifyId: string,
  ): Promise<TiltifyCampaignsResponse | TiltifyErrorResponse> {
    const resp = await fetch(
      `https://v5api.tiltify.com/api/public/users/${tiltifyId}/campaigns?
    updated_after=2024-10-01T00:00:00.000000Z`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!resp.ok) {
      return (await resp.json()) as TiltifyErrorResponse
    }

    return (await resp.json()) as TiltifyCampaignsResponse
  }

  private async getNewToken(
    refreshToken: string,
  ): Promise<TiltifyToken | null> {
    const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID
    const TILTIFY_SECRET = this.env.TILTIFY_SECRET

    const body = {
      client_id: TILTIFY_CLIENT_ID,
      client_secret: TILTIFY_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }
    const refreshResponse = await fetch(
      'https://v5api.tiltify.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!refreshResponse.ok) {
      return null
    }
    const token: any = await refreshResponse.json()
    return {
      accessToken: token.access_token as string,
      createdAt: token.created_at as string,
      refreshToken: token.refresh_token as string,
      expiresIn: token.expires_in as number,
      scope: token.scope as string,
      tokenType: token.token_type as string,
    }
  }

  private async getNewAppToken(): Promise<TiltifyToken | null> {
    const TILTIFY_CLIENT_ID = this.env.TILTIFY_CLIENT_ID
    const TILTIFY_SECRET = this.env.TILTIFY_SECRET
    const tokenRes = await fetch(
      `https://v5api.tiltify.com/oauth/token&client_id=${TILTIFY_CLIENT_ID}&client_secret=${TILTIFY_SECRET}&grant_type=client_credentials`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    if (!tokenRes.ok) {
      return null
    } else {
      const token: any = await tokenRes.json()
      return {
        accessToken: token.access_token as string,
        createdAt: token.created_at as string,
        refreshToken: '',
        expiresIn: token.expires_in as number,
        scope: token.scope as string,
        tokenType: token.token_type as string,
      }
    }
  }
}

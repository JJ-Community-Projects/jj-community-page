import type { TiltifyToken } from '../../TiltifyAPI.ts'
import { Cache } from './Cache.ts'
import type { InferSelectModel } from 'drizzle-orm'
import { tokens } from '../schema/auth-schema.ts'

export class TiltifyTokenCache extends Cache<string> {
  storeTokenFromDB(
    userSessionId: string,
    token: InferSelectModel<typeof tokens>,
  ) {
    return this.putStr(`tiltify:${userSessionId}`, token.accessToken, {
      expiration: token.expiresAt.getTime() / 1000,
    })
  }

  storeToken(userSessionId: string, token: TiltifyToken) {
    return this.putStr(`tiltify:${userSessionId}`, token.accessToken, {
      expirationTtl: token.expiresIn / 1000,
    })
  }

  getToken(userSessionId: string): Promise<string | null> {
    return this.getStr(`tiltify:${userSessionId}`)
  }

  deleteToken(userSessionId: string) {
    return this.delete(`tiltify:${userSessionId}`)
  }
}

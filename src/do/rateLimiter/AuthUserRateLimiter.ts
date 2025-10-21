import { RateLimiter, type RateLimiterOptions } from './RateLimiter.ts'


export class AuthUserRateLimiter extends RateLimiter {
  protected getOptions(): RateLimiterOptions {
    return {
      capacity: 100, // allow up to 20 tokens burst
      refillTokens: 240, // add 5 tokens
      refillIntervalMs: 60_000, // every 60 seconds → average 20 requests/min after burst
      gracePeriodMs: 5000, // small grace
    }
  }
}

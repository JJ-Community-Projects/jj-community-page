import { RateLimiter, type RateLimiterOptions } from './RateLimiter.ts'

export class TwitchExtensionRateLimiter extends RateLimiter {
  protected getOptions(): RateLimiterOptions {
    return {
      capacity: 100, // allow up to 20 tokens burst
      refillTokens: 100, // add 20 tokens
      refillIntervalMs: 60_000, // every 60 seconds → average 20 requests/min after burst
      gracePeriodMs: 5000, // small grace
    }
  }
}

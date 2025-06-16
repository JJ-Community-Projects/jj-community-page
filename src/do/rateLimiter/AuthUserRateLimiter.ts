import {RateLimiter} from "./RateLimiter.ts";


export class AuthUserRateLimiter extends RateLimiter {
  protected allowedRequestPerMinute(): number {
    return 180;
  }

  protected gracePeriodMs(): number {
    return 10000;
  }
}

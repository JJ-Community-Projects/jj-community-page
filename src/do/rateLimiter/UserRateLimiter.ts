import {RateLimiter} from "./RateLimiter.ts";

export class UserRateLimiter extends RateLimiter {
  protected allowedRequestPerMinute(): number {
    return 120;
  }

  protected gracePeriodMs(): number {
    return  5000;
  }
}

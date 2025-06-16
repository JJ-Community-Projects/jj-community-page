import {RateLimiter} from "./RateLimiter.ts";


export class UserRateLimiter extends RateLimiter {
  protected allowedRequestPerMinute(): number {
    return 60;
  }

  protected gracePeriodMs(): number {
    return  5000;
  }
}

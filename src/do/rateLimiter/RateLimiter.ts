import {DurableObject} from "cloudflare:workers";


export abstract class RateLimiter extends DurableObject<Env> {
  protected millisecondsPerRequest = 1;
  protected nextAllowedTime: number;

  protected constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.millisecondsPerRequest = 60000 / this.allowedRequestPerMinute();

    this.nextAllowedTime = 0;
  }

  protected abstract allowedRequestPerMinute(): number;

  protected abstract gracePeriodMs(): number;

  public async getMillisecondsToNextRequest(): Promise<number> {
    const now = Date.now();

    this.nextAllowedTime = Math.max(now, this.nextAllowedTime);
    this.nextAllowedTime += this.millisecondsPerRequest;

    return Math.max(
      0,
      this.nextAllowedTime - now - this.gracePeriodMs(),
    );
  }
}

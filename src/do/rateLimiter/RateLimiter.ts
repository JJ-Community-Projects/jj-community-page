import { DurableObject } from 'cloudflare:workers'

/**
 * Options that define how the rate limiter behaves.
 */
export interface RateLimiterOptions {
  /** Maximum number of tokens (burst capacity) */
  capacity: number
  /** Number of tokens added per refill interval */
  refillTokens: number
  /** Duration of each refill interval, in milliseconds */
  refillIntervalMs: number
  /** Optional grace period (in milliseconds) subtracted from wait time */
  gracePeriodMs?: number
}

/**
 * The persisted shape stored in storage for state continuity.
 */
interface PersistedState {
  tokens: number
  lastRefillTime: number
}

/**
 * An abstract rate-limiter durable object implementing a token-bucket style algorithm
 * with burst support, persistence, and feedback (remaining tokens / retry time).
 *
 * Subclasses must implement getOptions() to configure the limiter.
 */
export abstract class RateLimiter extends DurableObject<Env> {
  private capacity: number
  private refillTokens: number
  private refillIntervalMs: number
  private gracePeriodMs: number

  // In-memory state (mirrors persisted state for efficiency)
  private tokens: number
  private lastRefillTime: number

  constructor(state: DurableObjectState, env: Env) {
    super(state, env)

    const opts = this.getOptions()
    this.capacity = opts.capacity
    this.refillTokens = opts.refillTokens
    this.refillIntervalMs = opts.refillIntervalMs
    this.gracePeriodMs = opts.gracePeriodMs ?? 0

    // Initialize in-memory state; will load persisted state soon
    this.tokens = this.capacity
    this.lastRefillTime = Date.now()

    // Immediately attempt to load persisted state (but don’t await here in constructor)
    state.storage.get<PersistedState>('rl_state').then((p) => {
      if (p) {
        this.tokens = p.tokens
        this.lastRefillTime = p.lastRefillTime
      }
    })
  }

  /**
   * Attempt to consume `count` tokens. Returns feedback about allowance.
   * @param count Number of tokens to consume (default = 1)
   * @returns { allowed: boolean; remainingTokens: number; retryAfterMs: number }
   */
  public async attempt(count = 1): Promise<{
    allowed: boolean
    remainingTokens: number
    retryAfterMs: number
  }> {
    // load persisted state
    await this.loadState()

    // refill tokens as needed
    this.refill()

    if (this.tokens >= count) {
      // permitted
      this.tokens -= count
      await this.saveState()
      return {
        allowed: true,
        remainingTokens: this.tokens,
        retryAfterMs: 0,
      }
    } else {
      // not enough tokens → compute wait time
      const retryAfter = this.calculateRetryAfter(count)
      return {
        allowed: false,
        remainingTokens: this.tokens,
        retryAfterMs: retryAfter,
      }
    }
  }

  /**
   * Reset the limiter state to full capacity immediately.
   * Useful for administrative resets or tier-changes.
   */
  public async reset(): Promise<void> {
    this.tokens = this.capacity
    this.lastRefillTime = Date.now()
    await this.saveState()
  }

  /**
   * Subclasses must implement this to supply the limiter options.
   */
  protected abstract getOptions(): RateLimiterOptions

  /**
   * Load persisted state from Durable Object storage.
   */
  private async loadState(): Promise<void> {
    const p = await this.ctx.storage.get<PersistedState>('rl_state')
    if (p) {
      this.tokens = p.tokens
      this.lastRefillTime = p.lastRefillTime
    }
  }

  /**
   * Save the current in-memory state to Durable Object storage.
   */
  private async saveState(): Promise<void> {
    await this.ctx.storage.put<PersistedState>('rl_state', {
      tokens: this.tokens,
      lastRefillTime: this.lastRefillTime,
    })
  }

  /**
   * Refill tokens based on time elapsed since last refill.
   * Ensures tokens do not exceed capacity.
   */
  private refill(): void {
    const now = Date.now()
    if (now <= this.lastRefillTime) {
      return
    }

    const elapsed = now - this.lastRefillTime
    const intervals = Math.floor(elapsed / this.refillIntervalMs)
    if (intervals > 0) {
      const tokensToAdd = intervals * this.refillTokens
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefillTime += intervals * this.refillIntervalMs
    }
  }

  /**
   * Compute how many milliseconds until `count` tokens could be available.
   * Does *not* deduct tokens.
   * @param count Number of tokens desired
   * @returns milliseconds to wait (minimum 0)
   */
  private calculateRetryAfter(count: number): number {
    if (this.tokens >= count) {
      return 0
    }
    const tokensNeeded = count - this.tokens
    // number of refill intervals needed
    const intervalsNeeded = Math.ceil(tokensNeeded / this.refillTokens)
    const msUntil =
      this.lastRefillTime + intervalsNeeded * this.refillIntervalMs - Date.now()
    // subtract grace-period
    const wait = Math.max(0, msUntil - this.gracePeriodMs)
    return wait
  }
}

import { type ClientContext, ORPCError } from '@orpc/client'
import type {
  StandardLinkOptions,
  StandardLinkPlugin,
} from '@orpc/client/standard'

/** How long before expiry a subscription that sets `tokenRenewal` renews its WS token. */
export const RENEW_TOKEN_BEFORE_EXPIRY_SECONDS = 60

export type TokenRenewal = {
  /** Input of the renewal calls (default: the subscription's own input). */
  input?: unknown
  /** The server refused a renewal (UNAUTHORIZED, FORBIDDEN or NOT_FOUND): access is gone. */
  onRefused: () => void
}

/** Client context of a Durable Iterator subscription that renews its token. */
export type TokenRenewalContext = { tokenRenewal?: TokenRenewal }

const ACCESS_ERRORS: readonly string[] = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
]

/**
 * For `DurableIteratorLinkPlugin`'s `refreshTokenBeforeExpireInSeconds`: only the subscriptions
 * that set `context.tokenRenewal` renew their token; the others keep the first one.
 */
export const renewTokenBeforeExpiry = (
  _tokenPayload: unknown,
  options: { context: TokenRenewalContext },
) =>
  options.context.tokenRenewal ? RENEW_TOKEN_BEFORE_EXPIRY_SECONDS : Number.NaN

/**
 * The token renewals of the subscriptions that set `context.tokenRenewal`.
 *
 * `DurableIteratorLinkPlugin` renews a token by calling the subscription's procedure again with
 * the same options (input, context, abort signal), and retries a failed renewal every 2 seconds
 * without end. This plugin runs inside it (higher `order`), so it sees those calls too. From the
 * second call with the same abort signal on, it sends `tokenRenewal.input`. When the server
 * refuses a renewal for lack of access it calls `tokenRenewal.onRefused`, which should stop the
 * subscription: aborting its signal also ends the retries.
 */
export class TokenRenewalPlugin<
  T extends ClientContext & TokenRenewalContext,
> implements StandardLinkPlugin<T> {
  order = 1_600_000 // DurableIteratorLinkPlugin: 1_500_000

  init(options: StandardLinkOptions<T>) {
    const subscribed = new WeakSet<AbortSignal>()
    options.interceptors ??= []
    options.interceptors.push(async ({ next, ...call }) => {
      const renewal = call.context.tokenRenewal
      const signal = call.signal
      if (!renewal || !signal) return next()

      const isRenewal = subscribed.has(signal)
      try {
        const output = await next(
          isRenewal && renewal.input !== undefined
            ? { ...call, input: renewal.input }
            : call,
        )
        subscribed.add(signal)
        return output
      } catch (error) {
        if (
          isRenewal &&
          error instanceof ORPCError &&
          ACCESS_ERRORS.includes(error.code)
        ) {
          renewal.onRefused()
        }
        throw error
      }
    })
  }
}

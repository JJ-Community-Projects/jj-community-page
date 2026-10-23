import { DrizzleQueryError } from 'drizzle-orm'

// drizzle-orm 0.44+ wraps a failed query in `DrizzleQueryError`: message and stack read
// `Failed query: <sql>\nparams: <values>` and `.params` holds the bound values (the D1 error is
// on `.cause`). Logging it as is puts row values, e.g. a user's Tiltify tokens, in Workers logs
// (F-32).

const MAX_DEPTH = 10
const PREFIX = 'Failed query: '
const PARAMS = '\nparams: '

/**
 * A `DrizzleQueryError`, or an error that carries its message: one thrown in a Durable Object
 * reaches the caller through RPC as a plain `Error` with the same message.
 */
function isQueryError(error: unknown): boolean {
  if (error instanceof DrizzleQueryError) return true
  return (
    error instanceof Error &&
    error.message.startsWith(PREFIX) &&
    error.message.includes(PARAMS)
  )
}

/** The message without its `params: …` part. */
function queryMessage(error: Error): string {
  const { query } = error as Partial<DrizzleQueryError>
  if (typeof query === 'string') return PREFIX + query
  const at = error.message.indexOf(PARAMS)
  return at === -1 ? error.message : error.message.slice(0, at)
}

function holdsQueryError(error: unknown, depth = 0): boolean {
  if (!(error instanceof Error) || depth > MAX_DEPTH) return false
  return isQueryError(error) || holdsQueryError(error.cause, depth + 1)
}

/** `stack` with its `<name>: <message>` header replaced, keeping the frames. */
function restack(error: Error, header: string): string | undefined {
  const { stack } = error
  if (stack === undefined) return undefined
  const oldHeader = `${error.name}: ${error.message}`
  if (stack.startsWith(oldHeader)) return header + stack.slice(oldHeader.length)
  const frames = stack.search(/\n\s+at /)
  return frames === -1 ? header : header + stack.slice(frames)
}

function redact(error: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH || !holdsQueryError(error)) return error
  const source = error as Error
  // A real Error (so consoles print it as one) with the original's prototype and own properties.
  const copy = Object.setPrototypeOf(new Error(), Object.getPrototypeOf(source)) as Error
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(source))) {
    if (key === 'params' || key === 'stack') continue
    Object.defineProperty(copy, key, descriptor)
  }
  if (source.cause !== undefined) copy.cause = redact(source.cause, depth + 1)
  let stack = source.stack
  if (isQueryError(source)) {
    const message = queryMessage(source)
    copy.message = message
    stack = restack(source, `${source.name}: ${message}`)
  }
  // A data property: V8's own `stack` accessor would read the copy's frames, not the original's.
  Object.defineProperty(copy, 'stack', { value: stack, writable: true, configurable: true })
  return copy
}

/**
 * The error to pass to `console.*` instead of a caught `error`: a copy without the bound params
 * of any `DrizzleQueryError` in it or in its `cause` chain (SQL text, stack and D1 cause kept).
 * Anything else is returned unchanged.
 */
export function loggableError(error: unknown): unknown {
  return redact(error, 0)
}

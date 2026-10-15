import { env } from 'cloudflare:workers'
import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";

export function extractCFBinding(
  source: APIContext | ActionAPIContext | App.Locals | Env
): Env {
  // Astro contexts and locals no longer carry the Cloudflare runtime; bindings come from `cloudflare:workers`.
  // DOs and queues pass their own `Env` through unchanged.
  if ('locals' in source || 'session' in source) {
    return env
  } else {
    return source
  }
}

import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";

export function extractCFBinding(
  source: APIContext | ActionAPIContext | App.Locals | Env
): Env {
  if ('runtime' in source) {
    return source.runtime.env
  }else if ('locals' in source) {
    return source.locals.runtime.env
  } else {
    return source
  }
}

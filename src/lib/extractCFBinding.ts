import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";

export function extractCFBinding(
  source: APIContext | ActionAPIContext | App.Locals
) {
  if ('locals' in source) {
    return source.locals.runtime
  } else {
    return source.runtime
  }
}

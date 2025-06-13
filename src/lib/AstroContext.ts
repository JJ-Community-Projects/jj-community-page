import type {APIContext} from "astro";
import type {ActionAPIContext} from "astro:actions";

export type AstroContext = APIContext | ActionAPIContext

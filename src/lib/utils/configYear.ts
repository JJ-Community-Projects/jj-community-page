import { env } from 'cloudflare:workers'
import { nextJJYear } from './jjYear'

/** The year changes once a season; a per-isolate copy spares most pages a ConfigDO round trip. */
const CACHE_MS = 60_000
let cached: { year: number | undefined; until: number } | undefined

/** `web:config.year` from the ConfigDO; the next Jingle Jam's year when it isn't set. */
export async function getConfigYear(): Promise<number> {
  let entry = cached
  if (!entry || entry.until <= Date.now()) {
    const stub = env.ConfigDO.get(env.ConfigDO.idFromName('ConfigDO'))
    const year = await stub.getNumberConfig('web:config.year')
    entry = cached = { year, until: Date.now() + CACHE_MS }
  }
  return entry.year ?? nextJJYear()
}

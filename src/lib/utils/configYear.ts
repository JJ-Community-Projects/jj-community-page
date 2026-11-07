import { env } from 'cloudflare:workers'
import { isolateCached } from '../services/isolateCache'
import { nextJJYear } from './jjYear'

/** The year changes once a season; a per-isolate copy spares most pages a ConfigDO round trip. */
const CACHE_MS = 60_000

/** `web:config.year` from the ConfigDO; the next Jingle Jam's year when it isn't set. */
export async function getConfigYear(): Promise<number> {
  const year = await isolateCached('web:config.year', CACHE_MS, () => {
    const stub = env.ConfigDO.get(env.ConfigDO.idFromName('ConfigDO'))
    return stub.getNumberConfig('web:config.year')
  })
  return year ?? nextJJYear()
}

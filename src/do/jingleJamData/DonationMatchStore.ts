import { TiltifyAPI } from '../../lib/TiltifyAPI.ts'
import type { JJCampaign } from '../types/JJAPIModel.ts'
import { chunk } from '../utils/chunk.ts'
import type { TiltifyStore } from './TiltifyStore.ts'

// Per-campaign donation-match state, refreshed on a rolling sweep: each task
// tick queries the 100 campaigns that are most overdue (never queried first,
// then oldest `fetchedAt`), so the whole roster is covered every
// ceil(N / SWEEP_LIMIT) minutes regardless of roster size.
//
// Owns storage key: `donation-matches:state`.
type CampaignMatchState = {
  fetchedAt: number // epoch ms of the last completed query attempt
  activeStarts: string | null // latest startsAt ISO among active matches, else null
}

export type DonationMatchState = Record<string, CampaignMatchState>

const STATE_KEY = 'donation-matches:state'
const SWEEP_LIMIT = 100
const STALE_MS = 10 * 60 * 1000
const BATCH_SIZE = 20

export class DonationMatchStore {
  constructor(
    private storage: DurableObjectStorage,
    private tiltify: TiltifyStore,
    private env: Env,
  ) {}

  // One sweep tick: select the due campaigns, fan out, replace the record.
  async refreshActiveMatches() {
    const campaigns = await this.tiltify.getCampaigns()
    const api = new TiltifyAPI(this.env)
    const token = await api.getAppToken()
    if (!token) return // abort before any write; prior state intact

    const prev = await this.getState()
    const now = Date.now()
    const selected = this.selectDue(campaigns, prev, now)

    // Whole-record replace; campaigns that left the roster are pruned.
    const next: DonationMatchState = {}
    for (const c of campaigns) {
      const p = prev[c.id]
      if (p) next[c.id] = p
    }

    for (const batch of chunk(selected, BATCH_SIZE)) {
      const results = await Promise.all(
        batch.map(async (c) => {
          const resp = await api.getCampaignDonationMatches(c.id, token)
          if (resp === null) {
            // Request failure: keep the prior active starts but still stamp the
            // attempt, so a failing campaign backs off instead of being picked
            // again on the next tick.
            return [
              c.id,
              {
                fetchedAt: now,
                activeStarts: prev[c.id]?.activeStarts ?? null,
              },
            ] as const
          }

          // OK response with no active match ⇒ nothing running any more.
          let latestMs: number | null = null
          for (const m of resp.data ?? []) {
            if (!m.active) continue
            // Tiltify serialises dates as ISO strings (the generated type says
            // Date); treat anything unparseable as absent rather than throwing
            // away the whole sweep.
            const ms =
              typeof m.startsAt === 'string'
                ? Date.parse(m.startsAt)
                : m.startsAt?.getTime()
            if (typeof ms !== 'number' || Number.isNaN(ms)) continue
            if (latestMs === null || ms > latestMs) latestMs = ms
          }
          return [
            c.id,
            {
              fetchedAt: now,
              activeStarts:
                latestMs === null ? null : new Date(latestMs).toISOString(),
            },
          ] as const
        }),
      )
      for (const [id, state] of results) next[id] = state
    }

    await this.storage.put(STATE_KEY, next)
  }

  async getState(): Promise<DonationMatchState> {
    return (await this.storage.get<DonationMatchState>(STATE_KEY)) ?? {}
  }

  // Due = never queried, or queried more than STALE_MS ago. Never-queried first,
  // then oldest fetchedAt; the storage (slug) order of `campaigns` breaks ties.
  private selectDue(
    campaigns: JJCampaign[],
    prev: DonationMatchState,
    now: number,
  ): JJCampaign[] {
    const due = campaigns.filter((c) => {
      const fetchedAt = prev[c.id]?.fetchedAt
      return fetchedAt === undefined || now - fetchedAt > STALE_MS
    })
    due.sort((a, b) => {
      const fa = prev[a.id]?.fetchedAt
      const fb = prev[b.id]?.fetchedAt
      if (fa === fb) return 0
      if (fa === undefined) return -1
      if (fb === undefined) return 1
      return fa - fb
    })
    return due.slice(0, SWEEP_LIMIT)
  }
}

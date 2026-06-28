import type {
  JingleJamResponse,
  JJCampaign,
} from '../../types/JJAPIModel.ts'

// Stateless fetch client for the JJ custom dashboard API
// (`JJ_DASHBOARD_URL` + `/api/tiltify` and `/api/campaigns`).
//
// Every request is bounded by an AbortSignal timeout. The campaigns endpoint
// returns a bare array under `campaigns` (verified against the live endpoint —
// the `JingleJamCampaignsResponse` type in JJAPIModel.ts is wrong).

const DEFAULT_TIMEOUT_MS = 15_000
const PAGE_LIMIT = 100

export interface CampaignsPage {
  campaigns: JJCampaign[]
  total: number
  limit: number
  offset: number
}

export class JJDashboardAPI {
  constructor(
    private baseUrl: string,
    private timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  // GET /api/tiltify — causes, event metadata + USD conversion rate.
  async fetchEvent(): Promise<JingleJamResponse> {
    const res = await fetch(this.baseUrl + '/api/tiltify', {
      signal: AbortSignal.timeout(this.timeoutMs),
    })
    if (!res.ok) {
      throw new Error(
        `Failed to fetch JingleJam event: ${res.status} ${res.statusText}`,
      )
    }
    return (await res.json()) as JingleJamResponse
  }

  // GET /api/campaigns?limit&offset — one page of campaigns.
  async fetchCampaignsPage(
    limit: number,
    offset: number,
  ): Promise<CampaignsPage> {
    const res = await fetch(
      `${this.baseUrl}/api/campaigns?limit=${limit}&offset=${offset}`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    )
    if (!res.ok) {
      throw new Error(
        `Failed to fetch JingleJam campaigns: ${res.status} ${res.statusText}`,
      )
    }
    const data = (await res.json()) as {
      campaigns?: JJCampaign[] | { list?: JJCampaign[] }
      total?: number
      limit?: number
      offset?: number
    }
    // Live endpoint returns a bare array under `campaigns`; tolerate the
    // documented-but-wrong `{ list }` shape defensively.
    const campaigns: JJCampaign[] = Array.isArray(data.campaigns)
      ? data.campaigns
      : (data.campaigns?.list ?? [])
    return {
      campaigns,
      total: data.total ?? campaigns.length,
      limit: data.limit ?? limit,
      offset: data.offset ?? offset,
    }
  }

  // Paginate the full campaign set, bounded by `total` (never an open loop).
  async fetchAllCampaigns(): Promise<JJCampaign[]> {
    const all: JJCampaign[] = []
    const first = await this.fetchCampaignsPage(PAGE_LIMIT, 0)
    all.push(...first.campaigns)

    const total = first.total
    // Hard upper bound on iterations so a misbehaving `total` can't spin.
    const maxPages = Math.ceil(Math.max(total, all.length) / PAGE_LIMIT) + 1
    let offset = PAGE_LIMIT
    for (let page = 1; page < maxPages && all.length < total; page++) {
      const next = await this.fetchCampaignsPage(PAGE_LIMIT, offset)
      if (next.campaigns.length === 0) break
      all.push(...next.campaigns)
      offset += PAGE_LIMIT
    }
    return all
  }
}

import type { APIRoute } from 'astro'

// TEMPORARY review harness (remove at cutover). Calls the same getter on both
// the live v1 `JingleJamData` and the parallel `JJ_DATA_V2` DO and diffs the
// JSON (ignoring the non-deterministic `date`/`built_at` stamps), so the
// maintainer can verify v2 reproduces v1 before repointing consumers.
//
//   GET /api/jj-data/v2-diff               -> diff every aggregate getter
//   GET /api/jj-data/v2-diff?populate=1    -> runOverdueNow() on v2 first
//   GET /api/jj-data/v2-diff?task=<name>   -> runTask(name) on v2 first
//
// Auth-gated identically to pause.ts (Bearer ORPC_DEI_SIGNING_KEY).

function authorize(ctx: Parameters<APIRoute>[0]): boolean {
  const secret = ctx.locals.runtime.env.ORPC_DEI_SIGNING_KEY
  const auth = ctx.request.headers.get('Authorization')
  if (!auth || !secret) return false
  return auth === `Bearer ${secret}`
}

function v1Stub(ctx: Parameters<APIRoute>[0]) {
  const DO = ctx.locals.runtime.env.JingleJamData
  return DO.get(DO.idFromName('JJ_API_CACHE'))
}

function v2Stub(ctx: Parameters<APIRoute>[0]) {
  const DO = ctx.locals.runtime.env.JJ_DATA_V2
  return DO.get(DO.idFromName('JJ_API_CACHE_V2'))
}

// Deep-equal that ignores volatile timestamp keys.
function equal(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b)
}

function stable(v: unknown): string {
  return JSON.stringify(normalize(v))
}

function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(v as Record<string, unknown>).sort()) {
      if (key === 'date' || key === 'built_at') continue
      out[key] = normalize((v as Record<string, unknown>)[key])
    }
    return out
  }
  return v
}

function count(v: unknown): number | undefined {
  if (Array.isArray(v)) return v.length
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.count === 'number') return o.count
    if (Array.isArray(o.campaigns)) return o.campaigns.length
    if (Array.isArray(o.list)) return o.list.length
    if (Array.isArray(o.causes)) return o.causes.length
  }
  return undefined
}

// Zero-arg aggregate getters to compare.
const GETTERS = [
  'getRaised',
  'getCollections',
  'getDonations',
  'getDollarConversionRate',
  'getGbpToEurRate',
  'getCauses',
  'getCausesTV',
  'getCausesDisplay',
  'getCampaigns',
  'getCampaignsDisplay',
  'getCampaignsDisplayAll',
  'getAllCampaignDisplay',
  'getCommunityCampaignsDisplay',
  'getCommunityCampaignsDisplayAll',
  'getValidTwitchLogins',
  'getInvalidTwitchLogins',
  'getLiveLogins',
  'getUserTagsDisplay',
  'getFullSchedule',
] as const

export const GET: APIRoute = async (ctx) => {
  if (!authorize(ctx)) return new Response('Unauthorized', { status: 401 })

  const v1 = v1Stub(ctx)
  const v2 = v2Stub(ctx)
  const url = new URL(ctx.request.url)

  if (url.searchParams.get('populate') === '1') {
    await v2.runOverdueNow()
  }
  const task = url.searchParams.get('task')
  if (task) {
    await v2.runTask(task)
  }

  const report: Record<string, unknown> = {}
  for (const name of GETTERS) {
    try {
      const [a, b] = await Promise.all([
        (v1 as any)[name](),
        (v2 as any)[name](),
      ])
      report[name] = {
        equal: equal(a, b),
        v1Count: count(a),
        v2Count: count(b),
      }
    } catch (e) {
      report[name] = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  const allEqual = Object.values(report).every(
    (r) => (r as { equal?: boolean }).equal === true,
  )
  return Response.json({ allEqual, report })
}

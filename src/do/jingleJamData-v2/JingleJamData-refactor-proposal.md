# JingleJamData — Refactor Proposal

> Companion to `JingleJamData-analysis.md` and `Scheduler-analysis.md`. Concrete
> target design. **Goals, in priority order: (1) simplicity, (2) no duplication,
> (3) performance.** Two hard constraints:
> - **Everything the DO owns stays *inside* the DO** — persisted in DO storage, not D1.
> - Every value the DO hands to consumers stays byte-identical (public contract unchanged).

---

## 0. The enabler: the DO is already SQLite-backed

`JingleJamData` is registered under `new_sqlite_classes` in `wrangler.jsonc` (migration
tag v1). That means **`ctx.storage.sql` (SQLite storage) is already available** — the DO
just doesn't use it; today it only uses the KV `get/put/list` API over a flat keyspace.
So we can adopt a proper relational store **inside the DO with zero class migration**.
This is what makes "keep everything in the DO" and "no duplication" achievable at the
same time.

---

## 1. Why the current design fights itself

Three structural facts from the analyses drive everything below:

1. **The same campaign lives in ~9 places.** In DO KV: 3 raw copies
   (`campaign:api:id|slug|user-slug`), 6 goal scalars, 2 per-entity display copies, and
   membership in 4 aggregate blobs. **And again in D1** (`jjCampaign`, written by
   `insertIntoDB`). No single source of truth, no transaction/version across tiers, kept
   in sync by hand — which already rotted into the `getCampaignBySlug`/`setCampaign`/
   `getCausesDisplayAll` key bugs.

2. **Projections are materialized, not computed.** `buildDisplayData` re-serializes four
   large blobs every 30s; the top-100 blobs are pure `slice(0,100)` of the `:all` blobs.
   This is the bulk of the 30s cost and the torn-state risk.

3. **The hot read path shares one isolate + flat keyspace with the heavy writer.** A
   rebuild does ~4×N individual `storage.get`s, each closing the input gate, so the
   Twitch-extension reads queue behind it.

The cure is not more DOs (over-engineering for a singleton). It is: **one source of
truth in DO SQLite storage, projections computed not stored, hot reads served from an
in-memory mirror.**

### The D1 `jjCampaign` copy can be deleted

`insertIntoDB` exports campaigns/causes to D1 `jjCampaign`/`jjCauses`. Auditing the
readers:
- `overlay/impl.ts` — its `jjCampaign` query is **commented out**; it already reads the
  DO (`getCampaign`, `getCausesTV`).
- `twitchExtension/util.ts` — two **single-table** `jjCampaign` reads (by `slug+year`,
  and by `json_extract(livestream,'$.channel')`). **No joins** to other D1 tables, so
  the DO can serve them directly via `getCampaignByUserSlug(slug)` and
  `getCampaignDisplay(channelId)` (both already exist on the DO).

So `insertIntoDB` and the D1 `jjCampaign`/`jjCauses` tables are removed entirely; the two
extension-util reads switch to DO RPC. Net effect: the campaign exists in exactly **one**
place — DO SQLite.

### What the DO legitimately still reads from D1 (input, not its own storage)

Three tasks consume **app-owned** D1 tables that the DO does not own and must not
duplicate: `buildUserTags` (reads `tags`/`userTags`/`userDisplayView`), `buildSchedule`
(reads `schedules`/`streams`/participants), `updateProfiles` (updates `accounts`). These
**read external data to derive a projection, which is then stored in the DO**, or perform
maintenance on app data (`accounts`). That is consuming external input — it does **not**
violate "the DO's own data lives in the DO." Everything the DO *owns* (campaigns, causes,
event meta, currency, twitch/live, and the derived userTags/schedule projections) lives
in DO SQLite.

---

## 2. Target architecture (one DO, everything inside it)

```
        ┌────────────────────────────────────────────────────────────┐
        │  JingleJamData (one SQLite-backed Durable Object)            │
        │                                                              │
        │  ┌─────────┐   ┌─────────────────────┐   ┌───────────────┐  │
        │  │ Sources │──▶│  DO SQLite storage  │──▶│  Projections  │  │
        │  │ (fetch  │   │  = SINGLE SOURCE    │   │ (pure, memo-  │──┼─▶ public
        │  │ clients)│   │  OF TRUTH           │   │  ized in mem) │  │   read methods
        │  └─────────┘   └──────────┬──────────┘   └───────────────┘  │
        │       ▲                   │ hydrate on cold start            │
        │       │ Scheduler         ▼                                  │
        │       │ (alarm)     in-memory mirror (serving cache)         │
        └───────┼──────────────────────────────────────────────────── ┘
                │
    JJ API / Tiltify / Twitch / FX        reads D1 only as INPUT for
                                          userTags / schedule / accounts
```

**Layer 1 — Sources.** Stateless fetch clients, one per upstream (`JJDashboardAPI`,
`TiltifyAPI`, `TwitchAPI`, `FxSource`). Every call has an `AbortSignal.timeout` and
returns plain typed data. No storage, no DO knowledge — unit-testable in isolation.

**Layer 2 — DO SQLite storage = the single source of truth.** Normalized tables
(`campaign`, `cause`, `meta`) via `ctx.storage.sql`. One row per entity; indexes for
slug/userSlug/twitchId/cause/raised. Transactional writes. This is fully inside the DO.

**Layer 3 — Projections.** Every public read shape is a **pure function of the SQLite
rows**, computed on demand and **memoized in memory by a `version` counter** that bumps
on any write. Nothing is materialized as a stored projection. The hottest path
(`getCampaignDisplay(channelId)`) is a single indexed `SELECT … WHERE twitch_id=?`
(or an in-memory `Map.get` on the mirror) — O(1)-ish, no flat-key scans.

**Serving mirror (optional perf layer).** For the per-viewer extension endpoints, the DO
keeps a small in-memory mirror (`Map`s by id/slug/twitchId) hydrated from SQLite on cold
start inside `blockConcurrencyWhile`, refreshed when `version` bumps. It is a derived
cache of the SQLite truth — still entirely inside the DO. (Can be dropped if SQLite reads
prove fast enough; start with it for the extension hot path.)

### What this collapses

| Concern | Today | Target (all in DO SQLite) |
| --- | --- | --- |
| Raw campaign | 3 DO KV copies + 1 D1 copy | **1 row** |
| Goals | 6 KV scalars | **2 columns** |
| Display projections | 8 materialized blobs/keys | **0 stored** — computed + memoized |
| top-100 vs `:all` | 2 stored blobs each | `ORDER BY raised DESC LIMIT 100` |
| Twitch user / live | `twitch:*` + `campaign:live:*` KV | **columns** on the row |
| `getCampaignsForCause` | load-all + filter | `WHERE cause_id=?` (indexed) |
| DO KV keyspace | ~12 dup-prone prefixes | scheduler bookkeeping only |
| D1 `jjCampaign`/`jjCauses` | live duplicate | **deleted** |

---

## 3. Data model (DO SQLite — `ctx.storage.sql`)

One row per entity, twitch/live/goals **denormalized onto the campaign row** so a
campaign is self-describing and projections need no joins.

```sql
CREATE TABLE cause (
  id TEXT PRIMARY KEY, year INT,
  name TEXT, logo TEXT, description TEXT, url TEXT, donate_url TEXT,
  raised REAL                                  -- base GBP
);

CREATE TABLE campaign (
  id TEXT PRIMARY KEY, year INT,
  slug TEXT, user_slug TEXT, cause_id TEXT,
  name TEXT, description TEXT, url TEXT, start_time TEXT,
  raised REAL, goal REAL, previous_goal REAL,  -- base GBP; previous_goal folds the 6-key fan-out
  user_name TEXT, user_avatar TEXT, user_url TEXT,
  -- presentation fields resolved at ingest/validate time:
  twitch_login TEXT, twitch_id TEXT, twitch_name TEXT, twitch_avatar TEXT,
  is_live INTEGER DEFAULT 0,
  youtube_url TEXT
);
CREATE INDEX campaign_slug      ON campaign(slug);
CREATE INDEX campaign_user_slug ON campaign(user_slug);
CREATE INDEX campaign_twitch_id ON campaign(twitch_id);
CREATE INDEX campaign_cause     ON campaign(cause_id);
CREATE INDEX campaign_raised    ON campaign(raised DESC);

-- tiny key/value for event meta + currency rates (replaces a pile of singleton KV keys)
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
-- keys: date, event, raised, collections, donations, usd_rate, eur_rate, eur_rate_at, version, built_at
```

Notes:
- **Currencies computed, not stored.** Store base GBP; projections call
  `toCurrencies(gbp, usdRate, eurRate)` using the two rates from `meta`. Kills the
  3×-currency materialization.
- **`previous_goal` is a column**, written by the same diff logic as today
  (`updateGoalsAfterSetCampaigns`) but as one row update instead of 6 keys.
- **Stale rows reconciled**: ingest upserts the fetched set, then
  `DELETE FROM campaign WHERE id NOT IN (…)` — removed campaigns/causes can't linger
  (fixes the ghost-keys gap).
- **Twitch + live are columns**, set by `syncSocials`/`validateTwitch`/`checkLive` —
  no separate `twitch:*`/`campaign:live:*` keyspace.

### DO KV after the refactor

Only scheduler bookkeeping remains as KV (or move it into a `scheduler` SQLite table):
`paused`, `lastRun:*`, `enabled:*`, `fails:*`. `clear()` becomes meaningful/per-concern
(`DELETE FROM campaign` / `TRUNCATE`-style) instead of a global `deleteAll()`.

---

## 4. Projections serve every public getter

Public method names stay identical; each is now a pure read off SQLite (memoized).

| Public getter | Served from |
| --- | --- |
| `getCampaign{,BySlug,ByUserSlug}` | `SELECT … WHERE id/slug/user_slug=?` (indexed) |
| `getCampaigns`, `getCampaignsForCause` | `SELECT … [WHERE cause_id=?]` |
| `getGoalByUserSlug`, `getPreviousGoalByUserSlug` | columns on the row |
| `getCampaignsDisplay` | `… ORDER BY raised DESC LIMIT 100`, mapped to TV |
| `getCampaignsDisplayAll` | all rows, mapped to TV |
| `getCausesDisplay`, `getCausesTV`, `getTVCause` | `cause` rows, mapped |
| `getCommunityCampaignsDisplay` / `…All` | same rows, community shape (+LIMIT for non-All) |
| `getCampaignDisplay(channelId)` | `WHERE twitch_id=?` (or mirror `Map.get`) — hot path |
| `getRaised/Collections/Donations/Date` | `meta` |
| `getDollarConversionRate`, `getGbpToEurRate` | `meta` |
| `getLiveLogins`, `getValid/InvalidTwitchLogins` | derived from `campaign` rows |
| `getUserTagsDisplay` | `userTags` projection (built from D1, stored in DO) |
| `getFullSchedule` | `schedule` projection (built from D1, stored in DO) |

The `date: new Date()` that varies per blob today becomes a single `meta.built_at`
stamped once per ingest cycle — output shape unchanged, now consistent across projections.

---

## 5. Store sketch (`ctx.storage.sql`)

```ts
class Store {
  constructor(private sql: SqlStorage) {}

  upsertCampaigns(rows: CampaignRow[]) {
    // single transaction; previous_goal diff computed in JS, one statement per row,
    // or a multi-row INSERT … ON CONFLICT DO UPDATE with correct (real) column count
    this.sql.exec('BEGIN')
    for (const r of rows) this.sql.exec(UPSERT_CAMPAIGN, ...vals(r))
    this.sql.exec(`DELETE FROM campaign WHERE id NOT IN (${placeholders})`, ...ids)
    this.bumpVersion()
    this.sql.exec('COMMIT')
  }

  // pure projection, memoized by meta.version
  campaignsTVAll(): JJCampaignsTVType {
    return this.memo('campaignsTVAll', () => {
      const usd = this.usdRate(), eur = this.eurRate()
      const list = [...this.sql.exec(`SELECT * FROM campaign ORDER BY raised DESC`)]
        .map(r => toCampaignTV(r, usd, eur))
      return { count: list.length, campaigns: list, date: this.builtAt() }
    })
  }
  campaignsTVTop() {                              // was a 2nd stored blob
    const all = this.campaignsTVAll()
    return { ...all, count: Math.min(100, all.count), campaigns: all.campaigns.slice(0,100) }
  }
  campaignByTwitchId(id: string) {               // extension hot path
    return this.sql.exec(`SELECT * FROM campaign WHERE twitch_id=? LIMIT 1`, id).one()
  }
}
```

`memo` returns the cached value while `meta.version` is unchanged and recomputes once
after an ingest. The extension endpoint hits the indexed `twitch_id` lookup (or the
in-memory mirror) and never recomputes a list.

---

## 6. Tasks refactor

### 6a. Consolidated task set

Today's 8 tasks (with a 4-call mega-task) become a small dependency-aware set. Each is
**idempotent, timed, writes DO SQLite**, and the cycle bumps `version` once.

| Task | Cadence | Depends on | Does |
| --- | --- | --- | --- |
| `ingestEvent` | 60s | — | JJ `/api/tiltify`: causes, event meta, USD rate → SQLite |
| `ingestCampaigns` | 60s | — | JJ `/api/campaigns` (paged, capped by `total`): campaigns + goal-diff → SQLite; reconcile deletes |
| `checkLive` | 3m | campaigns | Twitch streams → `is_live` column (keep last-known on API error) |
| `fetchFX` | 4h | — | GBP→EUR (validated, last-good) → `meta` |
| `syncSocials` | 3h | campaigns | Tiltify `getUserBySlug` (bounded concurrency ~8) → twitch/youtube columns |
| `validateTwitch` | 6h | socials | resolve twitch id/name/avatar → columns |
| `buildUserTags` | 4h | — (reads D1) | D1 → `userTags` projection (stored in DO) |
| `buildSchedule` | 1h | — (reads D1) | D1 → `schedule` projection (stored in DO) |
| `updateProfiles` | 2h | — (writes D1 `accounts`) | Tiltify → `accounts` |

Key change: **no `buildDisplayData` and no `insertIntoDB`.** Projections compute on read,
so the only "build" is the cheap `version` bump; ingest writes SQLite directly with
`ON CONFLICT DO UPDATE` and correct chunking. This removes the single most expensive and
most contention-causing recurring task. The old chain
`refresh → refreshAllCampaigns → insertIntoDB → buildDisplayData` becomes
`ingestEvent + ingestCampaigns` (+ implicit projection invalidation).

### 6b. Scheduler engine fixes (from the bug list)

Same poll-on-alarm runner, corrected:
- **Completion-time `lastRun`** (kills cadence drift).
- **Exponential backoff** via `fails:*` + `nextRetryAt = now + min(everyMs, base·2^fails)`;
  reset on success. Kills the ~2 Hz hammer loop.
- **Per-task timeout** wrapper (sources already time out).
- **Concurrency mutex** — the whole alarm cycle and every manual `runTask`/`runOverdueNow`
  run behind one in-DO lock; the alarm and admin actions never interleave.
- **Schedule next alarm in `finally`** — a thrown/timed-out task can't strand the loop.
- **Pause gates manual runs** — `runTask`/`runOverdueNow` check `isSchedulerPaused()`.
- **Self-bootstrapping alarm** — `ensureAlarm()` called from the constructor (closes the
  orphaned-`ensureAlarm` gap; no admin poke needed after cold start).
- **Independent task failure** — a failed task no longer aborts the cycle; dependents are
  skipped for that cycle with last-known state preserved.

### 6c. Retire the bypass path

`admin.refreshJJAPIData` re-implements a different subset of the pipeline out of band.
Replace with `scheduler.runOverdueNow()` so exactly one code path mutates state.

---

## 7. Consumer changes (small, contract-preserving)

- **`twitchExtension/util.ts`** — replace the two D1 `jjCampaign` queries with
  `jjStub.getCampaignByUserSlug(slug)` and `jjStub.getCampaignDisplay(channelId)`.
- **`overlay/impl.ts`** — already DO-based; delete the commented-out D1 block.
- **Delete** `jjCampaign`/`jjCauses` D1 tables + `insertIntoDB` once the above land.
- All other getters keep identical names and output shapes.

---

## 8. Reduced public surface

The ~60 one-line facade delegates exist only because logic was split into modules over
shared KV. With a single `Store` backed by SQLite, the DO holds `this.store` and its
public methods are direct reads — no second indirection layer. The class shrinks and a
new getter is a one-place change. External method names are unchanged so callers don't
move.

---

## 9. Migration plan (incremental, build stays green, contract unchanged)

1. **Create the SQLite schema** in the DO (`ctx.storage.sql`, `campaign`/`cause`/`meta`).
   No reads change yet.
2. **Dual-write ingest**: write both the new SQLite rows and the old KV keys, so nothing
   breaks mid-migration. Verify SQLite rows match KV.
3. **Add the `Store` projections + in-memory mirror**, hydrated from SQLite. Point read
   getters at projections behind a flag; diff outputs against the old KV-backed getters
   until byte-identical.
4. **Cut reads over to projections**; delete the materialized display builders and the
   `campaign:display:*`/`campaigns:display*`/`community:*`/`cause:tv:*` writes.
5. **Move twitch/live into columns**; delete `twitch:*`, `campaign:live:*`,
   `campaign:api:*`, `campaign-goal:*` KV; stop the dual-write.
6. **Migrate the two extension-util reads to the DO; delete `insertIntoDB` + D1
   `jjCampaign`/`jjCauses`.**
7. **Refactor the scheduler** to the consolidated tasks + engine fixes; drop
   `buildDisplayData`; retire `refreshJJAPIData`'s bespoke path.

Because all of the DO's data is derived from upstream, any step can fall back to a cold
rebuild (`runOverdueNow`) if a backfill is skipped.

---

## 10. Before / after (the wins)

- **Storage:** a campaign goes from ~9 copies to **1 SQLite row**. No `:all`/top-100
  duplication; no D1 copy.
- **30s cycle:** no four-blob re-serialization, no 4×N `storage.get`; ingest is upserts
  + one `version` bump. The heaviest recurring work is gone.
- **Hot reads:** extension/overlay become an indexed `twitch_id` lookup / mirror
  `Map.get`, off the flat-scan path.
- **Correctness:** one source of truth + transactional upsert + single `built_at`
  removes skew; delete-reconcile removes ghosts; the latent multi-key getter bugs vanish.
- **Resilience:** backoff + timeouts + mutex + finally-reschedule + self-bootstrap +
  last-known-good on partial failure.
- **Simplicity:** DO KV reduced to scheduler bookkeeping; no facade boilerplate tier;
  one ingest path; projections are pure functions you can unit-test with an in-memory
  SQLite; **everything the DO owns lives in the DO.**

---

## 11. Risks & trade-offs

- **DO SQLite storage limits.** SQLite-backed DOs have generous per-object storage; ~1k
  campaigns × small rows is comfortably within limits. The dataset is bounded by the
  event.
- **In-memory mirror vs eviction.** The mirror rehydrates from SQLite on cold start
  inside `blockConcurrencyWhile` (one indexed scan, sub-100ms for ~1k rows). If even that
  window is unacceptable, the SQLite reads alone are fast enough to serve directly — the
  mirror is an optimization, not a requirement.
- **Denormalization onto the row.** Twitch/goal fields live on the single campaign row
  rather than in side tables — intentional: self-describing rows, no joins, still one
  source.
- **Cross-store reads remain for app-owned data.** `buildUserTags`/`buildSchedule`/
  `updateProfiles` still touch D1 because that data is owned by the app, not the DO. The
  DO stores only the *derived* projection (in DO SQLite). This respects "the DO's data
  stays in the DO" without duplicating app data into it.
- **Not splitting into multiple DOs.** Deliberate for a singleton, low-QPS dashboard. If
  profiling later shows the isolate is CPU-bound during ingest, split only the heavy
  writer from the read path — two DOs, not seven.

# JingleJamData v2 — Implementation Guide (handoff)

> Step-by-step plan to build the design in `JingleJamData-refactor-proposal.md`.
> Written so a fresh agent can take over with no prior context. Read the proposal
> first, then this.
>
> **Strategy: clean-room parallel build.** Build a complete, self-contained new DO
> stack under `src/do/jingleJamData-v2/`. Do **not** touch `src/do/jingleJamData/`
> (the old stack) or its modules. The new stack deploys *alongside* the old one under
> its own binding so it can be reviewed/compared live. When approved: repoint consumers
> to v2, delete the old stack, and rename `jingleJamData-v2` → `jingleJamData`.

---

## 0. Golden rules (read before touching code)

1. **Do not modify `src/do/jingleJamData/**` or `src/do/JingleJamData.ts`.** The old
   stack stays fully working and untouched until the final cutover step.
2. **Mirror the public method surface exactly.** v2's DO class must expose the same
   method names and return the same shapes as today's `JingleJamData` (see §3), so the
   eventual cutover is a binding/class swap — not a consumer rewrite.
3. **Everything the DO owns lives in DO storage** (`ctx.storage.sql`). No new D1 tables
   for campaigns/causes/meta. D1 is read only as *input* for the userTags / schedule /
   accounts tasks (same as today).
4. **v2 is self-populating.** It has its own scheduler/alarm and rebuilds all data from
   upstream, so it can be reviewed in isolation without any data copied from v1.
5. **Ship in the order below.** Each step ends with a green build and a verification gate.
6. **Verify, don't assume.** The `JingleJamCampaignsResponse` type is wrong; the live
   `/api/campaigns` returns `{ campaigns: JJCampaign[], total, limit, offset }` (a bare
   array). Trust the live endpoint, not the type.
7. **Commit per step** (repo style: single-line messages).

---

## 1. Orientation — the old stack (read-only reference)

You will **reimplement** these behaviours in v2, reading the originals only as a spec.

| Area | File (reference only) | What to reproduce |
| --- | --- | --- |
| Facade DO | `src/do/JingleJamData.ts` | the full public method surface (§3) |
| Tiltify cache | `src/do/jingleJamData/TiltifyStore.ts` | campaign/cause/goal/meta ingest, socials |
| Twitch | `src/do/jingleJamData/TwitchTracker.ts` | validation, live polling, per-campaign live flag |
| Currency | `src/do/jingleJamData/CurrencyStore.ts` | USD custodian + GBP→EUR scrape |
| Display | `src/do/jingleJamData/DisplayBuilder.ts` | **exact** projection field mapping → port to pure fns |
| Schedule | `src/do/jingleJamData/ScheduleBuilder.ts` | full-schedule build from D1 |
| User tags | `src/do/jingleJamData/UserTagsBuilder.ts` | tags projection from D1 |
| Scheduler | `src/do/jingleJamData/Scheduler.ts` | task set + alarm mechanics (corrected in v2) |
| Shared utils | `src/do/utils/{twitchLogins,currencyFormat,chunk}.ts` | **reuse directly**, don't copy |
| Types | `src/do/types/JJAPIModel.ts` | `JingleJamResponse`, `JJCampaign`, `JJCause`, … |
| API clients | `src/lib/TiltifyAPI.ts`, `src/lib/twitchAPI.ts` | **reuse directly**, don't reimplement |

### Verified facts
- DO is **SQLite-backed** (`wrangler.jsonc` tag v1 `new_sqlite_classes` includes
  `JingleJamData`) → `ctx.storage.sql` works. v2's class must also be registered as a
  `new_sqlite_classes` entry.
- Old stub is addressed via `idFromName('JJ_API_CACHE')`. v2 uses its own name (e.g.
  `JJ_API_CACHE_V2`) until cutover.
- Two APIs: JJ custom (`JJ_DASHBOARD_URL`, `/api/tiltify` + `/api/campaigns`) and official
  Tiltify (`v5api.tiltify.com`, OAuth via `TiltifyAPI.getAppToken()`).
- Consumers reach the DO through `env.JingleJamData` (oRPC `context.env` / Astro
  `ctx.locals.runtime.env`) + `idFromName('JJ_API_CACHE')`. There are ~10 such call sites
  in `src/lib/orpc/**` and `src/pages/api/jj-data/**` — they are the cutover surface (§11).

---

## 2. Target file layout (everything new lives here)

```
src/do/jingleJamData-v2/
  JingleJamData-refactor-proposal.md   # the design (already here)
  IMPLEMENTATION.md                    # this file
  JingleJamDataV2.ts   # the DO class — public surface + alarm; constructs Store + Scheduler
  schema.ts            # SQL DDL + column lists + parameterized statements
  Store.ts             # SQLite reads/writes + memoized projections (+ optional in-mem mirror)
  projections.ts       # pure mappers: row -> JJCampaignTVType / JJCauseTVType / community
  tasks.ts             # task registry (ingestEvent, ingestCampaigns, checkLive, …)
  Scheduler.ts         # corrected engine (mutex, backoff, timeouts, finally, bootstrap)
  sources/
    JJDashboardAPI.ts  # /api/tiltify + /api/campaigns (timeouts, correct shapes)
    FxSource.ts        # GBP->EUR (validated, last-good)
  __tests__/           # unit tests for sources, projections, store
```

The class is named `JingleJamDataV2` during the build (renamed to `JingleJamData` at
cutover). Reuse `TiltifyAPI`, `TwitchAPI`, and `src/do/utils/*` by import — do not copy.

---

## 3. The public surface v2 must reproduce (the contract)

Open `src/do/JingleJamData.ts` and mirror **every** public method name + return type on
`JingleJamDataV2`. These are the externally-consumed ones (must be byte-identical output):

- Campaigns: `getCampaign`, `getCampaignBySlug`, `getCampaignByUserSlug`, `getCampaigns`,
  `getCampaignsForCause`
- Goals: `getGoalByUserSlug`, `getPreviousGoalByUserSlug`
- Causes/meta: `getCauses`, `getCause`, `getRaised`, `getCollections`, `getDonations`, `getDate`
- Currency: `getDollarConversionRate`, `getGbpToEurRate`
- Twitch: `getLiveLogins`, `getValidTwitchLogins`, `getInvalidTwitchLogins`,
  `getTwitchChannelByChannelId`
- Display (hot): `getCampaignDisplay`, `getAllCampaignDisplay`, `getCampaignsDisplay`,
  `getCampaignsDisplayAll`, `getCausesDisplay`, `getCausesTV`, `getTVCause`,
  `getCommunityCampaignsDisplay`, `getCommunityCampaignsDisplayAll`
- Tags/schedule: `getUserTagsDisplay`, `getFullSchedule`
- Scheduler/admin: `alarm`, `ensureAlarm`, `getNextAlarmStr`, `getTasksStatus`,
  `setTaskEnabled`, `setSchedulerPaused`, `isSchedulerPaused`, `runTask`, `runOverdueNow`,
  `getDueInfo`
- Lifecycle: `clear`

> Write setters too if any consumer calls them (grep each name in `src/lib` + `src/pages`).
> Internal-only methods from the old modules (e.g. `insertIntoDB`, `buildDisplayData`,
> `refreshAllCampaigns`) do **not** need to exist on v2 — that work moves inside the
> scheduler/store. Keep `refresh`/`runOverdueNow` if admin calls them.

Confirm the exact shapes against the contracts:
`src/lib/orpc/public/twitchExtension/contract.ts`, `…/public/jjData/contract.ts`,
`…/private/jjData/contract.ts`, and the `*TVType` types.

---

## 4. Step 0 — Register the parallel DO (wrangler)

Add the v2 class so it can deploy alongside v1. Edit **both** wrangler blocks (there are
two binding sets in `wrangler.jsonc` — keep them in sync):

```jsonc
// add a NEW migration tag (do not edit existing tags)
{ "tag": "vN", "new_sqlite_classes": ["JingleJamDataV2"] }

// add a binding
{ "name": "JJ_DATA_V2", "class_name": "JingleJamDataV2" }
```

Export `JingleJamDataV2` from wherever DOs are exported (grep how `JingleJamData` is
exported in the worker entry, and mirror it). Run `wrangler types` to regenerate
`worker-configuration.d.ts`.

**Gate:** `pnpm build` green; `JJ_DATA_V2` appears in `worker-configuration.d.ts`.

---

## 5. Step 1 — SQLite schema (`schema.ts`)

Implement the DDL + statements from proposal §3 (`cause`, `campaign`, `meta` + indexes):
- `CREATE_TABLES: string[]`, `init(sql: SqlStorage)` (idempotent `CREATE TABLE IF NOT EXISTS`).
- `UPSERT_CAMPAIGN`, `UPSERT_CAUSE`, `SET_META` parameterized statements.
- `CAMPAIGN_COLUMNS`, `CAUSE_COLUMNS` real arrays (use to size multi-row inserts correctly —
  never hardcode `COLS=4`).

Call `init` from the `JingleJamDataV2` constructor.

**Gate:** in `wrangler dev`, a temp method confirms tables exist
(`SELECT name FROM sqlite_master`).

---

## 6. Step 2 — Sources (`sources/`)

- `JJDashboardAPI.ts`:
  - `fetchEvent(): Promise<JingleJamResponse>` → `GET {JJ_DASHBOARD_URL}/api/tiltify`.
  - `fetchCampaignsPage(limit, offset): Promise<{campaigns: JJCampaign[]; total; limit; offset}>`.
  - `fetchAllCampaigns()` → paginate bounded by `total` (no `while(true)`).
  - All fetches use `AbortSignal.timeout(...)`.
- `FxSource.ts`: `fetchGbpToEur(): Promise<number | null>` — the scrape, but **return
  `null` on any failure** (never `1`) and validate `0.5 < r < 2`.
- Reuse `TiltifyAPI`/`TwitchAPI`; add bounded concurrency (~8) + timeout at the call site
  in tasks, not inside those clients.

**Gate:** unit tests (recorded fixtures or one live run) — `fetchAllCampaigns()` returns
≈`total` and terminates; `fetchGbpToEur()` returns a sane number or `null`.

---

## 7. Step 3 — Projections + Store (`projections.ts`, `Store.ts`)

`projections.ts` — pure, no I/O. Port the **exact** field mapping from `DisplayBuilder.ts`
(read it carefully): `toCampaignTV(row, usdRate, eurRate)`, `toCauseTV(row)`,
`toCommunityCampaign(row,…)`. Live flag + twitch fields come from row columns now.

`Store.ts`:
- Writers (transactional, bump `meta.version` + set `meta.built_at`): `upsertCauses`,
  `upsertCampaigns` (port the `previous_goal` diff from `updateGoalsAfterSetCampaigns`),
  `setMeta`, `setLive`, `setSocials`, `setTwitchResolved`. Reconcile deletes with
  `DELETE … WHERE id NOT IN (…)`.
- Readers (memoized by `meta.version`): one per getter in §3. `campaignsTVAll()` sorts by
  raised desc; `campaignsTVTop()` = `.slice(0,100)`. `campaignByTwitchId(id)` = indexed
  lookup (hot path).
- Optional in-memory mirror (Maps by id/slug/twitchId) for the extension path — add only if
  needed; rehydrate from SQLite on cold start in `blockConcurrencyWhile`.

**Gate:** Vitest — seed rows via writers, assert readers reproduce the expected shapes
(capture a few from the live v1 endpoints as fixtures; exclude the non-deterministic `date`,
assert it's valid ISO instead).

---

## 8. Step 4 — Scheduler + tasks (`Scheduler.ts`, `tasks.ts`)

Implement the corrected engine (proposal §6b) + consolidated tasks (§6a):

Tasks (each idempotent, timed, writes SQLite via `Store`):
`ingestEvent` (60s), `ingestCampaigns` (60s), `checkLive` (3m, dep: campaigns),
`fetchFX` (4h), `syncSocials` (3h, dep: campaigns), `validateTwitch` (6h, dep: socials),
`buildUserTags` (4h, reads D1), `buildSchedule` (1h, reads D1), `updateProfiles`
(2h, writes D1 accounts). **No `buildDisplayData`, no `insertIntoDB`.**

Engine requirements:
- One in-DO **mutex** around the whole alarm cycle and every manual `runTask`/`runOverdueNow`.
- `lastRun` stamped at **completion**.
- **Backoff**: `fails:<name>` + `nextRetryAt = now + min(everyMs, base·2^fails)`; reset on success.
- Per-task **timeout** wrapper; `scheduleNextAlarm()` in a `finally`.
- `runTask`/`runOverdueNow` **check pause**.
- `ensureAlarm()` from the **constructor** (self-bootstrap).
- Dependency-aware: a failed dependency skips dependents for that cycle, last-known state preserved.
- Keep admin method signatures (`getTasksStatus`, `setTaskEnabled`, `setSchedulerPaused`,
  `isSchedulerPaused`, `runTask`, `runOverdueNow`, `getDueInfo`, `getNextAlarmStr`).

**Gate:** in `wrangler dev`, `runOverdueNow()` populates SQLite; `getTasksStatus()` shows
advancing `lastRunMs`; a forced-failing task backs off (logs) instead of 2 Hz looping;
pause deletes the alarm.

---

## 9. Step 5 — Assemble the DO class (`JingleJamDataV2.ts`)

Wire it together: constructor builds `Store(ctx.storage.sql)` + `Scheduler` + sources,
runs `schema.init`, calls `ensureAlarm()`. Implement every §3 method as a thin read off
`Store` (or delegate to `Scheduler`). `clear()` = per-concern SQLite deletes (and reset
scheduler bookkeeping) — not a blanket `deleteAll()`.

**Gate:** all §3 methods exist and type-check; `pnpm build` green.

---

## 10. Step 6 — Review harness (compare v2 vs live v1)

So the maintainer can review before cutover, add a temporary admin/test route that calls
the **same getter on both** `JJ_DATA_V2` and `JingleJamData` and diffs the JSON (exclude
`date`). E.g. `GET /api/jj-data/v2-diff` (auth-gate it like `pause.ts`). Trigger
`JJ_DATA_V2.runOverdueNow()` first so it's populated.

**Gate (the review):** for each getter in §3, v2 output equals v1 output (date excluded).
Hand off to the maintainer for sign-off. Iterate on `projections.ts` until clean.

---

## 11. Step 7 — Cutover (after sign-off)

Goal: consumers use v2, with minimal churn. Recommended path = **class rename** so the
existing `JingleJamData` binding resolves to the new code and no consumer edits are needed:

1. Delete the old stack: `src/do/jingleJamData/**` and `src/do/JingleJamData.ts`.
2. Rename the folder `jingleJamData-v2` → `jingleJamData`, and the class
   `JingleJamDataV2` → `JingleJamData`. Update imports.
3. In `wrangler.jsonc`: point the existing `JingleJamData` binding at the renamed class and
   drop the temporary `JJ_DATA_V2` binding. Use a `renamed_classes` migration entry if
   Cloudflare requires it for the class-name change; otherwise add the renamed class under a
   new `new_sqlite_classes` tag and remove the old. Since all data is derived, a fresh
   (empty) DO that self-populates on first alarm is acceptable — confirm the brief empty
   window is OK, or pre-warm with `runOverdueNow` right after deploy.
4. Keep the stub name `idFromName('JJ_API_CACHE')` so the ~10 consumer call sites are
   unchanged.
5. `wrangler types`; `pnpm build`.

Alternative (more consumer churn, no rename): keep v2 as `JingleJamDataV2`/`JJ_DATA_V2` and
update every consumer to use the v2 binding. Only do this if the class-rename path is
blocked.

**Gate:** full end-to-end smoke — extension `user-data`/`campaigns` (live flags present),
overlay, community page (top-100 + all), admin scheduler UI, `pause` API. All identical to
pre-cutover.

---

## 12. Step 8 — Cleanups

- Confirm no references remain to old KV prefixes or the v2 temp binding (grep).
- Fix the wrong `JingleJamCampaignsResponse` type (`JJAPIModel.ts:81-86`) →
  `campaigns: JJCampaign[]`.
- Optionally migrate `twitchExtension/util.ts`'s two D1 `jjCampaign` reads to the DO
  (`getCampaignByUserSlug` / `getCampaignDisplay`) and **drop `insertIntoDB` + the D1
  `jjCampaign`/`jjCauses` tables** — they have no other live readers (overlay's is
  commented out). Do this as a follow-up PR once v2 is stable.
- Address the handoff diagnostics if still present: `orpc-usage.ts:18` (default-import
  lint), `TiltifyStore.ts:262` (`await` on a string — but that file is being deleted, so
  moot after cutover).

---

## 13. Verification checklist (run at every gate)

- [ ] `pnpm build` succeeds; `wrangler types` clean.
- [ ] `JJ_DATA_V2.runOverdueNow()` populates SQLite; getters return non-empty data.
- [ ] v2-vs-v1 diff (§10) clean for every getter (date excluded).
- [ ] Extension endpoints return campaigns **with live flags**, identical shape.
- [ ] Overlay + community (top-100 and `:all`) unchanged.
- [ ] Admin scheduler UI: all tasks, `lastRunMs` advancing, pause works, backoff on failure.
- [ ] After cutover: grep shows no readers of old KV prefixes or `JJ_DATA_V2`.

---

## 14. Rollback posture

- Steps 0-6 are **purely additive** — v1 is untouched and serving all traffic, so there is
  nothing to roll back; just don't deploy the cutover.
- Step 7 (cutover) is the only risky step. Because all DO data is derived from upstream,
  recovery is: revert the cutover commit, redeploy, `runOverdueNow`. Keep cutover as a
  single isolated commit.

---

## 15. Open decisions to confirm with the maintainer

1. **In-memory mirror**: build now or start with direct SQLite reads and add only if the
   extension hot path needs it?
2. **Cutover mechanism**: class-rename onto the existing `JingleJamData` binding
   (recommended, zero consumer churn) vs repoint consumers to `JJ_DATA_V2`.
3. **Empty-window at cutover**: acceptable to start the new DO empty and self-populate
   (~1 cycle), or pre-warm with `runOverdueNow` immediately after deploy?
4. **Drop D1 `jjCampaign`/`jjCauses`** + migrate the two extension-util reads now or as a
   follow-up.
5. **Ingest cadence**: 60s (proposal) vs the current 30s — confirm freshness vs upstream load.
6. **`clear()` semantics**: per-concern only, or keep a full hard reset too.

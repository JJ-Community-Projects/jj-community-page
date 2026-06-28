import type { Store } from './Store.ts'
import {
  buildTasks,
  DEFAULT_TASK_TIMEOUT_MS,
  type TaskContext,
  type TaskDef,
} from './tasks.ts'

// Corrected alarm-driven task runner.
//
// Fixes over v1: completion-time `lastRun`, exponential backoff on failure
// (no more ~2 Hz hammer loop), a per-task timeout, one in-DO mutex around the
// whole cycle + every manual run, next-alarm scheduled in a `finally`, manual
// runs gated by pause, a self-bootstrapping alarm from the constructor, and
// dependency-aware skipping (a failed dependency skips its dependents for the
// cycle, preserving last-known state).
//
// Bookkeeping lives in DO KV storage: `v2:scheduler:paused`,
// `v2:task:lastRun:*`, `v2:task:enabled:*`, `v2:task:fails:*`,
// `v2:task:nextRetryAt:*`.

const BOOTSTRAP_DELAY_MS = 30 * 1000
const MIN_ALARM_GAP_MS = 500
const BACKOFF_BASE_MS = 30 * 1000

export interface TaskStatus {
  name: string
  everyMs: number
  enabled: boolean
  lastRunMs: number | null
  nextDueAtMs: number
  dueNow: boolean
}

export class Scheduler {
  private tasks: TaskDef[]
  private ctx: TaskContext
  private lock: Promise<void> = Promise.resolve()

  constructor(
    private storage: DurableObjectStorage,
    store: Store,
    env: Env,
  ) {
    this.tasks = buildTasks()
    this.ctx = { store, env }
  }

  // --- mutex: serialize the alarm cycle and every manual run ---
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.lock
    let release!: () => void
    this.lock = new Promise<void>((r) => (release = r))
    await prev
    try {
      return await fn()
    } finally {
      release()
    }
  }

  async alarm(alarmInfo?: AlarmInvocationInfo) {
    console.log('DO-scheduler-v2', 'alarm', {
      isRetry: alarmInfo?.isRetry,
      retryCount: alarmInfo?.retryCount,
    })
    await this.withLock(async () => {
      try {
        await this.runOverdueTasks(Date.now())
      } finally {
        await this.scheduleNextAlarm()
      }
    })
  }

  // --- pause ---
  async setSchedulerPaused(paused: boolean) {
    await this.storage.put('v2:scheduler:paused', paused)
    if (paused) {
      await this.storage.deleteAlarm()
      console.log('DO-scheduler-v2', 'paused – alarm deleted')
    } else {
      await this.scheduleNextAlarm()
      console.log('DO-scheduler-v2', 'resumed – alarm scheduled')
    }
  }

  async isSchedulerPaused(): Promise<boolean> {
    return (await this.storage.get<boolean>('v2:scheduler:paused')) ?? false
  }

  async setTaskEnabled(name: string, enabled: boolean) {
    await this.storage.put(this.keyEnabled(name), enabled)
    await this.ensureAlarm()
  }

  // --- admin: status ---
  async getTasksStatus(): Promise<TaskStatus[]> {
    const now = Date.now()
    const states: TaskStatus[] = []
    for (const t of this.tasks) {
      const [enabled, last, retryAt] = await Promise.all([
        this.isEnabled(t.name),
        this.getLastRun(t.name),
        this.getNextRetryAt(t.name),
      ])
      const next = Math.max((last ?? 0) + t.everyMs, retryAt ?? 0)
      states.push({
        name: t.name,
        everyMs: t.everyMs,
        enabled,
        lastRunMs: last ?? null,
        nextDueAtMs: next,
        dueNow: next <= now && enabled,
      })
    }
    return states
  }

  // --- manual runs (pause-gated, behind the mutex) ---
  async runTask(name: string) {
    if (await this.isSchedulerPaused()) {
      console.log('DO-scheduler-v2', 'runTask skipped – paused', name)
      return
    }
    const t = this.tasks.find((x) => x.name === name)
    if (!t) throw new Error(`Unknown task: ${name}`)
    await this.withLock(async () => {
      try {
        await this.runOne(t, Date.now())
      } finally {
        await this.scheduleNextAlarm()
      }
    })
  }

  async runOverdueNow() {
    if (await this.isSchedulerPaused()) {
      console.log('DO-scheduler-v2', 'runOverdueNow skipped – paused')
      return
    }
    await this.withLock(async () => {
      try {
        await this.runOverdueTasks(Date.now())
      } finally {
        await this.scheduleNextAlarm()
      }
    })
  }

  async getDueInfo(now: number) {
    let anyDue = false
    let nextDueAt = Number.POSITIVE_INFINITY
    const dueNames: string[] = []
    for (const t of this.tasks) {
      if (!(await this.isEnabled(t.name))) continue
      const next = await this.nextDueAt(t, now)
      if (next <= now) {
        anyDue = true
        dueNames.push(t.name)
      }
      if (next < nextDueAt) nextDueAt = next
    }
    if (!Number.isFinite(nextDueAt)) nextDueAt = now + 60_000
    return { anyDue, dueNames, nextDueAt }
  }

  async ensureAlarm() {
    if (await this.isSchedulerPaused()) return
    const existing = await this.storage.getAlarm()
    if (!existing) await this.storage.setAlarm(Date.now() + BOOTSTRAP_DELAY_MS)
  }

  async getNextAlarmStr() {
    return String(await this.storage.getAlarm())
  }

  // --- internal: run helpers ---
  private async nextDueAt(t: TaskDef, _now: number): Promise<number> {
    const last = await this.getLastRun(t.name)
    const retryAt = await this.getNextRetryAt(t.name)
    return Math.max((last ?? 0) + t.everyMs, retryAt ?? 0)
  }

  private async isDue(t: TaskDef, now: number): Promise<boolean> {
    if (!(await this.isEnabled(t.name))) return false
    return (await this.nextDueAt(t, now)) <= now
  }

  private withTimeout<T>(p: Promise<T>, ms: number, name: string): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`task ${name} timed out`)), ms),
      ),
    ])
  }

  // Run a single task with timeout + backoff bookkeeping.
  private async runOne(t: TaskDef, now: number): Promise<boolean> {
    const start = Date.now()
    try {
      console.log('DO-scheduler-v2', 'run', t.name)
      await this.withTimeout(
        t.run(this.ctx),
        t.timeoutMs ?? DEFAULT_TASK_TIMEOUT_MS,
        t.name,
      )
      await this.setLastRun(t.name, Date.now())
      await this.resetFails(t.name)
      console.log('DO-scheduler-v2', t.name, 'ms', Date.now() - start)
      return true
    } catch (e) {
      const fails = (await this.getFails(t.name)) + 1
      const backoff = Math.min(t.everyMs, BACKOFF_BASE_MS * 2 ** (fails - 1))
      await this.setFails(t.name, fails)
      await this.storage.put(this.keyNextRetryAt(t.name), now + backoff)
      console.error(
        'DO-scheduler-v2',
        'error',
        t.name,
        'fails',
        fails,
        'retryInMs',
        backoff,
        e,
      )
      return false
    }
  }

  private async runOverdueTasks(now: number) {
    const failedThisCycle = new Set<string>()
    for (const t of this.tasks) {
      if (!(await this.isDue(t, now))) continue
      if (t.dependsOn && failedThisCycle.has(t.dependsOn)) {
        console.log(
          'DO-scheduler-v2',
          'skip',
          t.name,
          'dependency failed',
          t.dependsOn,
        )
        continue
      }
      const ok = await this.runOne(t, now)
      if (!ok) failedThisCycle.add(t.name)
    }
  }

  private async scheduleNextAlarm() {
    if (await this.isSchedulerPaused()) {
      await this.storage.deleteAlarm()
      return
    }
    const now = Date.now()
    const { nextDueAt } = await this.getDueInfo(now)
    const when = Math.max(nextDueAt, now + MIN_ALARM_GAP_MS)
    await this.storage.setAlarm(when)
    console.log('DO-scheduler-v2', 'scheduleNextAlarm', when)
  }

  // --- bookkeeping keys + accessors ---
  private keyLastRun(name: string) {
    return `v2:task:lastRun:${name}`
  }
  private keyEnabled(name: string) {
    return `v2:task:enabled:${name}`
  }
  private keyFails(name: string) {
    return `v2:task:fails:${name}`
  }
  private keyNextRetryAt(name: string) {
    return `v2:task:nextRetryAt:${name}`
  }

  private async getLastRun(name: string) {
    return (await this.storage.get<number>(this.keyLastRun(name))) ?? undefined
  }
  private async setLastRun(name: string, ts: number) {
    await this.storage.put(this.keyLastRun(name), ts)
  }
  private async isEnabled(name: string) {
    return (await this.storage.get<boolean>(this.keyEnabled(name))) ?? true
  }
  private async getFails(name: string) {
    return (await this.storage.get<number>(this.keyFails(name))) ?? 0
  }
  private async setFails(name: string, n: number) {
    await this.storage.put(this.keyFails(name), n)
  }
  private async resetFails(name: string) {
    await this.storage.delete(this.keyFails(name))
    await this.storage.delete(this.keyNextRetryAt(name))
  }
  private async getNextRetryAt(name: string) {
    return (
      (await this.storage.get<number>(this.keyNextRetryAt(name))) ?? undefined
    )
  }
}

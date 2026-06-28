import type { TiltifyStore } from './TiltifyStore.ts'
import type { TwitchTracker } from './TwitchTracker.ts'
import type { CurrencyStore } from './CurrencyStore.ts'
import type { UserTagsBuilder } from './UserTagsBuilder.ts'
import type { DisplayBuilder } from './DisplayBuilder.ts'
import type { ScheduleBuilder } from './ScheduleBuilder.ts'

export interface SchedulerModules {
  tiltify: TiltifyStore
  twitch: TwitchTracker
  currency: CurrencyStore
  userTags: UserTagsBuilder
  display: DisplayBuilder
  schedule: ScheduleBuilder
}

// Central task runner — owns the Durable Object alarm, the pause switch and
// per-task lastRun + enabled bookkeeping. Each task's `run` fans out to a
// focused feature module.
//
// Owns storage keys: `scheduler:paused`, `task:lastRun:*`, `task:enabled:*`.
export class Scheduler {
  // Task definition
  private tasks = [
    {
      name: 'jjAPIRefresh',
      everyMs: 30 * 1000,
      run: async () => {
        await this.m.tiltify.refresh()
        await this.m.tiltify.refreshAllCampaigns()
        await this.m.tiltify.insertIntoDB()
        await this.m.display.buildDisplayData()
      },
    },
    {
      name: 'validateTwitchChannels',
      everyMs: 6 * 60 * 60 * 1000,
      run: async () => {
        await this.m.twitch.validateTwitchChannels()
      },
    },
    {
      name: 'checkLiveStreams',
      everyMs: 4 * 60 * 1000,
      run: async () => {
        await this.m.twitch.checkLiveStreams()
      },
    },
    {
      name: 'fetchGBPToEURConversionRate',
      everyMs: 4 * 60 * 60 * 1000,
      run: async () => {
        await this.m.currency.fetchGBPToEURConversionRate()
      },
    },
    {
      name: 'loadAllTiltifySocials',
      everyMs: 3 * 60 * 60 * 1000,
      run: async () => {
        await this.m.tiltify.loadAllTiltifySocials()
      },
    },
    {
      name: 'buildAndStoreUserTags',
      everyMs: 4 * 60 * 60 * 1000,
      run: async () => {
        await this.m.userTags.buildAndStoreUserTags()
      },
    },
    {
      name: 'generateFullSchedule',
      everyMs: 60 * 60 * 1000,
      run: async () => {
        await this.m.schedule.generateFullSchedule()
      },
    },
    {
      name: 'updateTiltifyProfiles',
      everyMs: 2 * 60 * 60 * 1000,
      run: async () => {
        await this.m.tiltify.updateTiltifyProfiles()
      },
    },
  ] as const

  constructor(
    private storage: DurableObjectStorage,
    private m: SchedulerModules,
  ) {}

  async alarm(alarmInfo?: AlarmInvocationInfo) {
    console.log('DO-scheduler', 'alarm', {
      isRetry: alarmInfo?.isRetry,
      retryCount: alarmInfo?.retryCount,
    })
    await this.runOverdueTasks(Date.now())
    await this.scheduleNextAlarm()
  }

  public async setSchedulerPaused(paused: boolean) {
    await this.storage.put('scheduler:paused', paused)
    if (paused) {
      await this.storage.deleteAlarm()
      console.log('DO-scheduler', 'paused – alarm deleted')
    } else {
      await this.scheduleNextAlarm()
      console.log('DO-scheduler', 'resumed – alarm scheduled')
    }
  }

  public async isSchedulerPaused(): Promise<boolean> {
    return (await this.storage.get<boolean>('scheduler:paused')) ?? false
  }

  public async setTaskEnabled(name: string, enabled: boolean) {
    await this.storage.put(this.keyEnabled(name), enabled)
    await this.ensureAlarm() // recompute next alarm in case enabling/disabling changes the schedule
  }

  // Expose scheduler state for admin UI
  public async getTasksStatus() {
    const now = Date.now()
    const states = [] as Array<{
      name: string
      everyMs: number
      enabled: boolean
      lastRunMs: number | null
      nextDueAtMs: number
      dueNow: boolean
    }>
    for (const t of this.tasks) {
      const [enabled, last] = await Promise.all([
        this.isEnabled(t.name),
        this.getLastRun(t.name),
      ])
      const next = (last ?? 0) + t.everyMs
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

  // Manually run a single task by name (updates lastRun and reschedules)
  public async runTask(name: string) {
    const t = this.tasks.find((x) => x.name === name)
    if (!t) throw new Error(`Unknown task: ${name}`)
    const start = Date.now()
    console.log('DO-scheduler', 'manual-run', name)
    await t.run()
    await this.setLastRun(name, Date.now())
    console.log('DO-scheduler', 'manual-run', name, 'ms', Date.now() - start)
    await this.scheduleNextAlarm()
  }

  // Run all overdue tasks now and reschedule
  public async runOverdueNow() {
    await this.runOverdueTasks(Date.now())
    await this.scheduleNextAlarm()
  }

  // Returns [dueNow, nextDueAtMs]
  public async getDueInfo(now: number) {
    let anyDue = false
    let nextDueAt = Number.POSITIVE_INFINITY
    const dueNames: string[] = []

    for (const t of this.tasks) {
      if (!(await this.isEnabled(t.name))) continue
      const last = await this.getLastRun(t.name)
      const next = (last ?? 0) + t.everyMs
      if (next <= now) {
        anyDue = true
        dueNames.push(t.name)
      }
      if (next < nextDueAt) nextDueAt = next
    }

    if (!Number.isFinite(nextDueAt)) {
      // If everything was disabled, try again soon (safety)
      nextDueAt = now + 60_000
    }
    return { anyDue, dueNames, nextDueAt }
  }

  // Call this once (manually or via any request) to bootstrap the first alarm
  public async ensureAlarm() {
    if (await this.isSchedulerPaused()) return
    const existing = await this.storage.getAlarm()
    if (!existing) {
      await this.scheduleNextAlarm(1000 * 30) // start in ~1min
    }
  }

  // Stringified next alarm timestamp (consumed by /api/jj-data/nextAlarm)
  public async getNextAlarmStr() {
    return String(await this.storage.getAlarm())
  }

  // Storage keys
  private keyLastRun(name: string) {
    return `task:lastRun:${name}`
  }

  private keyEnabled(name: string) {
    return `task:enabled:${name}`
  }

  // Read last run (ms since epoch), undefined if never
  private async getLastRun(name: string) {
    return (await this.storage.get<number>(this.keyLastRun(name))) ?? undefined
  }

  private async setLastRun(name: string, ts: number) {
    await this.storage.put(this.keyLastRun(name), ts)
  }

  private async isEnabled(name: string) {
    const val = await this.storage.get<boolean>(this.keyEnabled(name))
    return val ?? true // default: enabled
  }

  // Run only the tasks that are currently overdue
  private async runOverdueTasks(now: number) {
    for (const t of this.tasks) {
      if (!(await this.isEnabled(t.name))) continue
      const last = await this.getLastRun(t.name)
      const next = (last ?? 0) + t.everyMs
      if (next <= now) {
        const start = Date.now()
        try {
          console.log('DO-scheduler', 'run', t.name)
          await t.run()
          await this.setLastRun(t.name, now)
          console.log('DO-scheduler', t.name, 'ms', Date.now() - start)
        } catch (e) {
          console.error('DO-scheduler', 'error', t.name, e)
          // Do not update lastRun on failure; it will retry next alarm
        }
      }
    }
  }

  // Compute and set the next alarm based on soonest next-due task
  private async scheduleNextAlarm(afterNowMs?: number) {
    if (await this.isSchedulerPaused()) {
      await this.storage.deleteAlarm()
      return
    }
    const now = Date.now()
    if (afterNowMs && afterNowMs > 0) {
      await this.storage.setAlarm(now + afterNowMs)
      console.log('DO-scheduler', 'scheduleNextAlarm', now + afterNowMs)
      return
    }
    const { nextDueAt } = await this.getDueInfo(now)
    // Clamp next alarm not earlier than now + 1s to avoid tight loops
    const when = Math.max(nextDueAt, now + 500)
    await this.storage.setAlarm(when)
    console.log('DO-scheduler', 'scheduleNextAlarm', when)
  }
}

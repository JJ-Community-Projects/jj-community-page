import { type Component, For, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'
import { Button } from '../../ui/Button'
import { Alert, Spinner } from '../../ui/Status'
import { cn } from '../../ui/cn'
import { adminTable } from './common/AdminSection'

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms} ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm}m`
}

function fmtWhen(ts: number) {
  try {
    const d = new Date(ts)
    return isNaN(d.getTime()) ? '—' : d.toISOString().replace('T', ' ').replace('Z', ' UTC')
  } catch {
    return '—'
  }
}

export const AdminSchedulerSection: Component = () => {
  const admin = orpcPrivate.admin
  const qc = useQueryClient()

  const tasksQuery = useQuery(() => admin.getSchedulerTasksStatus.queryOptions({
    staleTime: 5_000,
  }))

  const refetchAll = async () => {
    await qc.invalidateQueries({ queryKey: admin.getSchedulerTasksStatus.queryKey() })
  }

  const toggle = useMutation(() => admin.setTaskEnabled.mutationOptions({
    onSuccess: refetchAll,
  }))

  const runOne = useMutation(() => admin.runSchedulerTask.mutationOptions({
    onSuccess: refetchAll,
  }))

  const runOverdue = useMutation(() => admin.runOverdueTasksNow.mutationOptions({
    onSuccess: refetchAll,
  }))

  const togglePaused = useMutation(() => admin.setSchedulerPaused.mutationOptions({
    onSuccess: refetchAll,
  }))

  return (
    <>
      <div class="flex flex-wrap items-center gap-2">
        <Show when={tasksQuery.data}>
          {(data) => (
            <Button
              size="sm"
              variant={data().paused ? 'danger' : 'accent'}
              disabled={togglePaused.isPending}
              onClick={() => togglePaused.mutate({ paused: !data().paused })}
              title={data().paused ? 'Resume the alarm scheduler' : 'Pause the alarm scheduler (cron triggers still work)'}
            >
              {togglePaused.isPending ? '…' : data().paused ? 'Scheduler Paused' : 'Scheduler Active'}
            </Button>
          )}
        </Show>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={tasksQuery.isFetching}
            onClick={() => tasksQuery.refetch()}
          >
            {tasksQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={runOverdue.isPending}
            onClick={() => runOverdue.mutate()}
          >
            {runOverdue.isPending ? 'Running…' : 'Run overdue now'}
          </Button>
        </div>
      </div>

      <Show when={tasksQuery.isLoading}>
        <Spinner label="Loading…" />
      </Show>
      <Show when={tasksQuery.isError}>
        <Alert tone="danger">Failed to load tasks</Alert>
      </Show>
      <Show when={tasksQuery.data?.tasks}>
        {(tasks) => (
          <div class={adminTable.wrap}>
            <table class={adminTable.table}>
              <thead class={adminTable.head}>
                <tr>
                  <th class={adminTable.th}>Task</th>
                  <th class={adminTable.th}>Interval</th>
                  <th class={adminTable.th}>Enabled</th>
                  <th class={adminTable.th}>Last run</th>
                  <th class={adminTable.th}>Next due</th>
                  <th class={cn(adminTable.th, 'text-right')}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={tasks()}>{(t) => (
                  <tr class={adminTable.row}>
                    <td class={cn(adminTable.td, 'font-semibold')}>{t.name}</td>
                    <td class={adminTable.td}>{fmtMs(t.everyMs)}</td>
                    <td class={adminTable.td}>
                      <Button
                        size="sm"
                        variant={t.enabled ? 'accent' : 'secondary'}
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ name: t.name, enabled: !t.enabled })}
                        title={t.enabled ? 'Disable' : 'Enable'}
                      >
                        {t.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </td>
                    <td class={cn(adminTable.td, 'whitespace-nowrap')}>
                      {t.lastRunMs ? fmtWhen(t.lastRunMs) : '—'}
                    </td>
                    <td class={cn(adminTable.td, 'whitespace-nowrap', t.dueNow && 'text-warning-700 font-semibold')}>
                      {fmtWhen(t.nextDueAtMs)}
                    </td>
                    <td class={cn(adminTable.td, 'text-right')}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={runOne.isPending}
                        onClick={() => runOne.mutate({ name: t.name })}
                      >
                        Run now
                      </Button>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        )}
      </Show>
    </>
  )
}

export default AdminSchedulerSection

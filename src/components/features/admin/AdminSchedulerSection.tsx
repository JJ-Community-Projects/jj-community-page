import { type Component, For, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'

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

  return (
    <div class="rounded border border-gray-300 bg-white p-4">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Background Tasks</h2>
        <div class="flex items-center gap-2">
          <button
            class={`rounded px-3 py-1.5 text-white ${tasksQuery.isFetching ? 'bg-gray-400' : 'bg-neutral-800 hover:bg-neutral-700'}`}
            disabled={tasksQuery.isFetching}
            onClick={() => tasksQuery.refetch()}
          >
            {tasksQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            class={`rounded px-3 py-1.5 text-white ${runOverdue.isPending ? 'bg-gray-400' : 'bg-accent hover:opacity-90'}`}
            disabled={runOverdue.isPending}
            onClick={() => runOverdue.mutate()}
          >
            {runOverdue.isPending ? 'Running…' : 'Run overdue now'}
          </button>
        </div>
      </div>

      <Show when={tasksQuery.data} fallback={<p class="text-sm text-gray-500">{tasksQuery.isLoading ? 'Loading…' : tasksQuery.isError ? 'Failed to load tasks' : ''}</p>}>
        {(tasks) => (
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="py-2 pr-4 text-left">Task</th>
                  <th class="py-2 pr-4 text-left">Interval</th>
                  <th class="py-2 pr-4 text-left">Enabled</th>
                  <th class="py-2 pr-4 text-left">Last run</th>
                  <th class="py-2 pr-4 text-left">Next due</th>
                  <th class="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={tasks()}>{(t) => (
                  <tr class="border-b last:border-0">
                    <td class="py-2 pr-4 font-medium">{t.name}</td>
                    <td class="py-2 pr-4">{fmtMs(t.everyMs)}</td>
                    <td class="py-2 pr-4">
                      <button
                        class={`rounded px-2 py-1 text-xs ${t.enabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ name: t.name, enabled: !t.enabled })}
                        title={t.enabled ? 'Disable' : 'Enable'}
                      >
                        {t.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td class="py-2 pr-4">
                      {t.lastRunMs ? fmtWhen(t.lastRunMs) : '—'}
                    </td>
                    <td class={`py-2 pr-4 ${t.dueNow ? 'text-orange-700 font-medium' : ''}`}>
                      {fmtWhen(t.nextDueAtMs)}
                    </td>
                    <td class="py-2 pr-0 text-right">
                      <button
                        class={`rounded px-3 py-1.5 text-white text-xs ${runOne.isPending ? 'bg-gray-400' : 'bg-primary hover:bg-primary-600'}`}
                        disabled={runOne.isPending}
                        onClick={() => runOne.mutate({ name: t.name })}
                      >
                        Run now
                      </button>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        )}
      </Show>
    </div>
  )
}

export default AdminSchedulerSection

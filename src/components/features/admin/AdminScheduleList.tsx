import { type Component, createSignal, For, Show } from 'solid-js'
import { QueryComponent } from '../../common/QueryComponent'
import { orpcPrivate } from '../../../lib/orpc/client'
import { useMutation } from '@tanstack/solid-query'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Labels'
import { Alert, EmptyState, Spinner } from '../../ui/Status'
import { cn } from '../../ui/cn'
import { adminTable } from './common/AdminSection'

// The section trigger carries the "All schedules" heading
export const AdminScheduleList: Component = () => {
  const exportSchedule = useMutation(() => orpcPrivate.admin.exportSchedule.mutationOptions())
  const [exportError, setExportError] = createSignal(false)
  return (
    <QueryComponent
      queryOptions={() => orpcPrivate.admin.getAllSchedules.queryOptions()}
      loading={() => <Spinner label="Loading…" />}
    >
      {(schedules) => (
        <Show when={schedules.length > 0} fallback={<EmptyState title="No schedules found." />}>
          <Show when={exportError()}>
            <Alert tone="danger" class="mb-3">Export failed</Alert>
          </Show>
          <div class={adminTable.wrap}>
            <table class={adminTable.table}>
              <thead class={adminTable.head}>
                <tr>
                  <th class={adminTable.th}>ID</th>
                  <th class={adminTable.th}>Year</th>
                  <th class={adminTable.th}>Owner</th>
                  <th class={adminTable.th}>Visible</th>
                  <th class={adminTable.th}>Primary</th>
                  <th class={cn(adminTable.th, 'text-right')}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={schedules}>
                  {(s) => (
                    <tr class={adminTable.row}>
                      <td class={adminTable.td}>{s.scheduleId}</td>
                      <td class={adminTable.td}>{s.year}</td>
                      <td class={cn(adminTable.td, 'whitespace-nowrap')}>
                        <div class="flex flex-col">
                          <span>{s.ownerName || '—'}</span>
                          <span class="text-fg-muted text-xs">User ID: {s.ownerId}</span>
                        </div>
                      </td>
                      <td class={adminTable.td}>
                        <Chip size="sm" tone={s.visible ? 'accent' : 'neutral'}>
                          {s.visible ? 'Yes' : 'No'}
                        </Chip>
                      </td>
                      <td class={adminTable.td}>
                        <Show when={s.primary} fallback={<span class="text-fg-muted">—</span>}>
                          <Chip size="sm" tone="primary">Primary</Chip>
                        </Show>
                      </td>
                      <td class={cn(adminTable.td, 'text-right whitespace-nowrap')}>
                        <div class="inline-flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              setExportError(false)
                              try {
                                const json = await exportSchedule.mutateAsync({ scheduleId: s.scheduleId })
                                const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                const name = `schedule-${s.scheduleId}.json`
                                a.download = name
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                URL.revokeObjectURL(url)
                              } catch (e) {
                                console.error('Export failed', e)
                                setExportError(true)
                              }
                            }}
                            title="Export schedule"
                          >
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="accent"
                            href={`/dashboard/schedules/${s.scheduleId}/edit`}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      )}
    </QueryComponent>
  )
}

import { type Component, For, Show } from 'solid-js'
import { QueryComponent } from '../../common/QueryComponent'
import { orpcPrivate } from '../../../lib/orpc/client'
import { useMutation } from '@tanstack/solid-query'

export const AdminScheduleList: Component = () => {
  const exportSchedule = useMutation(() => orpcPrivate.admin.exportSchedule.mutationOptions())
  return (
    <QueryComponent
      queryOptions={() => orpcPrivate.admin.getAllSchedules.queryOptions()}
    >
      {(schedules) => (
        <div class="mt-4">
          <h3 class="text-lg font-semibold mb-2">All Schedules</h3>
          <Show when={schedules.length > 0} fallback={<div class="text-sm text-gray-500">No schedules found.</div>}>
            <div class="overflow-x-auto rounded border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visible</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <For each={schedules}>
                    {(s) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.scheduleId}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.year}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          <div class="flex flex-col">
                            <span>{s.ownerName || '—'}</span>
                            <span class="text-xs text-gray-400">User ID: {s.ownerId}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm">
                          <span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${s.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {s.visible ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm">
                          <span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${s.primary ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'}`}>
                            {s.primary ? 'Primary' : '—'}
                          </span>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-right">
                          <div class="inline-flex gap-2">
                            <button
                              type="button"
                              class="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                              onClick={async () => {
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
                                  alert('Export failed')
                                }
                              }}
                              title="Export schedule"
                            >
                              Export
                            </button>
                            <a
                              href={`/dashboard/schedules/${s.scheduleId}/edit`}
                              class="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                            >
                              Edit
                            </a>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      )}
    </QueryComponent>
  )
}

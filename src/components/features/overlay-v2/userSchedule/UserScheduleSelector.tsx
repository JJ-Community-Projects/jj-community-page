import { type Component, createSignal, For, Show } from 'solid-js'
import { orpcPublic } from '../../../../lib/orpc/client.ts'
import { useQuery } from '@tanstack/solid-query'

export const UserScheduleSelector: Component = () => {
  const year = new Date().getUTCFullYear()

  const q = useQuery(() =>
    orpcPublic.schedules.getVisiblePrimarySchedulesByYear.queryOptions({
      input: { year },
      staleTime: 60_000,
    }),
  )

  const [value, setValue] = createSignal<string>('')

  const navigate = (slug: string) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('scheduleId')
    url.searchParams.set('scheduleSlug', slug)
    window.location.href = url.toString()
  }

  return (
    <div class="p-4">
      <h2 class="mb-2 text-lg font-semibold">Select a schedule to preview</h2>
      <Show when={q.isLoading}>
        <p>Loading…</p>
      </Show>
      <Show when={q.error}>
        <p class="text-red-400">Failed to load schedules</p>
      </Show>
      <Show when={q.data}>
        {(items) => (
          <div class="flex items-center gap-2">
            <select
              class="rounded bg-black/40 px-2 py-1"
              value={value()}
              onChange={(e) => setValue(e.currentTarget.value)}
            >
              <option value="">Choose…</option>
              <For each={items()}>
                {(s) => <option value={s.slug}>{s.title}</option>}
              </For>
            </select>
            <button
              class="rounded bg-primary-500 px-3 py-1"
              disabled={!value()}
              onClick={() => navigate(value()!)}
            >
              Open
            </button>
          </div>
        )}
      </Show>
    </div>
  )
}

export default UserScheduleSelector

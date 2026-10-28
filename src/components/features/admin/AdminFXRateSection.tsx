import { type Component, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'

export const AdminFXRateSection: Component = () => {
  const rateQuery = useQuery(() =>
    orpcPrivate.admin.getGBPToEURRate.queryOptions({
      staleTime: 60_000,
    }),
  )

  return (
    <div class="rounded-lg border border-neutral-700 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">FX: GBP → EUR</h2>
        <button
          class="rounded-sm bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          onClick={() => rateQuery.refetch()}
          disabled={rateQuery.isFetching}
        >
          {rateQuery.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div class="mt-2 text-sm text-neutral-600">
        <Show when={rateQuery.isSuccess} fallback={<span>Loading…</span>}>
          <div>
            Current rate: <span class="font-mono">{rateQuery.data?.toFixed(4)}</span>
          </div>
        </Show>
      </div>
    </div>
  )
}

import { type Component, Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Status'

export const AdminFXRateSection: Component = () => {
  const rateQuery = useQuery(() =>
    orpcPrivate.admin.getGBPToEURRate.queryOptions({
      staleTime: 60_000,
    }),
  )

  return (
    <div class="flex items-center gap-3">
      <div class="min-w-0 flex-1 text-sm">
        <Show when={rateQuery.isSuccess} fallback={<Spinner label="Loading…" />}>
          Current rate:{' '}
          <span class="font-mono font-semibold">
            {rateQuery.data?.toFixed(4)}
          </span>
        </Show>
      </div>
      <Button
        size="sm"
        variant="accent"
        onClick={() => rateQuery.refetch()}
        disabled={rateQuery.isFetching}
      >
        {rateQuery.isFetching ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  )
}

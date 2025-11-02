import { type Component, For, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'

export const AdminTwitchSection: Component = () => {
  const admin = orpcPrivate.admin
  const qc = useQueryClient()

  const listQuery = useQuery(() => admin.getTwitchStreams.queryOptions())

  const triggerCheck = useMutation(() =>
    admin.triggerTwitchLiveCheck.mutationOptions({
      onSuccess: async () => {
        // refetch the list after triggering a new check
        await qc.invalidateQueries({ queryKey: admin.getTwitchStreams.queryKey() })
      },
    }),
  )

  const syncFromSocials = useMutation(() =>
    admin.syncTwitchChannelsFromSocials.mutationOptions({
      onSuccess: async () => {
        // After syncing channels, refresh the stream list as new channels may appear
        await qc.invalidateQueries({ queryKey: admin.getTwitchStreams.queryKey() })
      },
    }),
  )

  return (
    <div class="flex flex-col gap-3 rounded border bg-white border-gray-300 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Twitch Tools</h2>
        <div class="flex items-center gap-3">
          <button
            class={`rounded px-4 py-2 text-white ${
              syncFromSocials.isPending
                ? 'bg-gray-400'
                : 'bg-primary hover:bg-primary-600'
            }`}
            disabled={syncFromSocials.isPending}
            onClick={() => syncFromSocials.mutate()}
          >
            {syncFromSocials.isPending ? 'Syncing…' : 'Sync channels from socials'}
          </button>
          {syncFromSocials.isSuccess && (
            <span class="text-sm text-green-700">Sync completed.</span>
          )}
          {syncFromSocials.isError && (
            <span class="text-sm text-red-700">Failed to sync.</span>
          )}
          <button
            class={`rounded px-4 py-2 text-white ${
              triggerCheck.isPending
                ? 'bg-gray-400'
                : 'bg-accent hover:opacity-90'
            }`}
            disabled={triggerCheck.isPending}
            onClick={() => triggerCheck.mutate()}
          >
            {triggerCheck.isPending ? 'Triggering…' : 'Trigger live check'}
          </button>
          <button
            class={`rounded px-4 py-2 text-white ${
              listQuery.isPending
                ? 'bg-gray-400'
                : 'bg-accent hover:opacity-90'
            }`}
            disabled={listQuery.isPending}
            onClick={() => listQuery.refetch()}
          >
            {listQuery.isPending ? 'Triggering…' : 'Trigger query'}
          </button>
          {triggerCheck.isSuccess && (
            <span class="text-sm text-green-700">Triggered successfully.</span>
          )}
          {triggerCheck.isError && (
            <span class="text-sm text-red-700">Failed to trigger. {JSON.stringify(triggerCheck.error, null, 2)}</span>
          )}
          {listQuery.isSuccess && (
            <span class="text-sm text-green-700">Triggered successfully.</span>
          )}
          {listQuery.isError && (
            <span class="text-sm text-red-700">Failed to trigger. {JSON.stringify(listQuery.error, null, 2)}</span>
          )}
        </div>
      </div>

      <p class="text-sm text-gray-600">
        Use these tools to manage Twitch integration:
        - Sync channels from user socials to populate missing twitch_channels rows.
        - Trigger live checks for all known channels. Below is the current status list.
      </p>

      <div class="mt-2">
        <Show when={listQuery.isSuccess} fallback={<p class="text-sm text-gray-500">{listQuery.isLoading ? 'Loading…' : listQuery.isError ? 'Failed to load streams.' : ''}</p>}>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b">
                  <th class="py-2 pr-4">Channel</th>
                  <th class="py-2 pr-4">Title</th>
                  <th class="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={listQuery.data ?? []}>{(item) => (
                  <tr class="border-b last:border-0 align-top">
                    <td class="py-2 pr-4">
                      <a
                        href={`https://twitch.tv/${item.userLogin}`}
                        target="_blank"
                        rel="noreferrer"
                        class="text-accent hover:underline"
                      >
                        {item.displayName ?? item.userLogin}
                      </a>
                    </td>
                    <td class="py-2 pr-4">
                      <span class="line-clamp-2 break-words">
                        {item.title ?? ''}
                      </span>
                    </td>
                    <td class="py-2 pr-4">
                      <span class={`${item.isLive ? 'text-green-700' : 'text-gray-600'}`}>
                        {item.isLive ? 'LIVE' : 'offline'}
                      </span>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
    </div>
  )
}

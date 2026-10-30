import { type Component, For, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'
import { Button } from '../../ui/Button'
import { LiveBadge } from '../../ui/Labels'
import { Alert, Spinner } from '../../ui/Status'
import { adminLink, adminTable, MutationStatus } from './common/AdminSection'

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
    <>
      <ul class="text-fg-muted list-disc pl-5 text-sm">
        <li>Sync channels from user socials to populate missing twitch_channels rows.</li>
        <li>Trigger live checks for all known channels. Below is the current status list.</li>
      </ul>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={syncFromSocials.isPending}
          onClick={() => syncFromSocials.mutate()}
        >
          {syncFromSocials.isPending ? 'Syncing…' : 'Sync channels from socials'}
        </Button>
        <MutationStatus status={syncFromSocials.status} />
        <Button
          size="sm"
          variant="accent"
          disabled={triggerCheck.isPending}
          onClick={() => triggerCheck.mutate()}
        >
          {triggerCheck.isPending ? 'Triggering…' : 'Trigger live check'}
        </Button>
        <MutationStatus status={triggerCheck.status} />
        <Button
          size="sm"
          disabled={listQuery.isFetching}
          onClick={() => listQuery.refetch()}
        >
          {listQuery.isFetching ? 'Refreshing…' : 'Refresh list'}
        </Button>
      </div>

      <Show when={triggerCheck.error}>
        {(error) => <Alert tone="danger">Failed to trigger: {error().message}</Alert>}
      </Show>
      <Show when={listQuery.error}>
        {(error) => <Alert tone="danger">Failed to load streams: {error().message}</Alert>}
      </Show>
      <Show when={listQuery.isLoading}>
        <Spinner label="Loading…" />
      </Show>

      <Show when={listQuery.isSuccess}>
        <div class={adminTable.wrap}>
          <table class={adminTable.table}>
            <thead class={adminTable.head}>
              <tr>
                <th class={adminTable.th}>Channel</th>
                <th class={adminTable.th}>Title</th>
                <th class={adminTable.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              <For each={listQuery.data ?? []}>{(item) => (
                <tr class={adminTable.row}>
                  <td class={adminTable.td}>
                    <a
                      href={`https://twitch.tv/${item.userLogin}`}
                      target="_blank"
                      rel="noreferrer"
                      class={adminLink}
                    >
                      {item.displayName ?? item.userLogin}
                    </a>
                  </td>
                  <td class={adminTable.td}>
                    <span class="line-clamp-2 wrap-break-word">
                      {item.title ?? ''}
                    </span>
                  </td>
                  <td class={adminTable.td}>
                    <Show when={item.isLive} fallback={<span class="text-fg-muted">offline</span>}>
                      <LiveBadge />
                    </Show>
                  </td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </Show>
    </>
  )
}

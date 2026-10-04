import { type Component, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'

/**
 * Admin toggle for the KV-backed `content:visibility` flag. When hidden, the
 * OBS overlays and the community/teams/yogs pages render their pre-event
 * placeholder instead of content.
 */
export const AdminOverlayVisibilitySection: Component = () => {
  const qc = useQueryClient()

  // Read/write both go through the private RPC router. `/api/public` is served
  // by an OpenAPIHandler, which the `orpcPublic` (RPCLink) client cannot talk to.
  const hiddenQuery = useQuery(() =>
    orpcPrivate.admin.getContentVisibility.queryOptions(),
  )

  const setVisibility = useMutation(() =>
    orpcPrivate.admin.setContentVisibility.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: orpcPrivate.admin.getContentVisibility.queryKey(),
        })
      },
    }),
  )

  const hidden = () => hiddenQuery.data ?? true

  return (
    <div class="rounded border border-gray-300 bg-white p-4">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Overlay &amp; community content</h2>
        <button
          class={`rounded px-3 py-1.5 text-white ${hidden() ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
          disabled={
            hiddenQuery.isLoading ||
            hiddenQuery.isError ||
            setVisibility.isPending
          }
          onClick={() => setVisibility.mutate({ hidden: !hidden() })}
          title={
            hidden()
              ? 'Show overlays and community content'
              : 'Hide overlays and community content'
          }
        >
          {setVisibility.isPending
            ? '…'
            : hidden()
              ? 'Hidden — click to show'
              : 'Visible — click to hide'}
        </button>
      </div>
      <Show when={hiddenQuery.isError}>
        <p class="text-sm text-red-600">Failed to load current visibility.</p>
      </Show>
      <p class="text-sm text-gray-500">
        Controls the pre-event placeholder on the OBS overlays and the
        community, teams and yogs pages. Stored in KV under{' '}
        <code>content:visibility</code>; a missing key defaults to hidden. KV is
        eventually consistent, so a change can take up to a minute to reach
        every visitor.
      </p>
    </div>
  )
}

export default AdminOverlayVisibilitySection

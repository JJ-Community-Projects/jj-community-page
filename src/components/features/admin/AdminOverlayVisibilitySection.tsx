import { type Component, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client'
import { Button } from '../../ui/Button'
import { Alert } from '../../ui/Status'

/**
 * Admin toggle for the KV-backed `content:visibility` flag. When hidden, the
 * OBS overlays and the community/teams/yogs pages render their pre-event
 * placeholder instead of content.
 */
export const AdminOverlayVisibilitySection: Component = () => {
  const qc = useQueryClient()

  // Read/write both go through the private RPC router.
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
    <>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
        <p class="text-fg-muted min-w-0 flex-1 text-sm">
          Controls the pre-event placeholder on the OBS overlays and the
          community, teams and yogs pages. Stored in KV under{' '}
          <code>content:visibility</code>; a missing key defaults to hidden. KV
          is eventually consistent, so a change can take up to a minute to
          reach every visitor.
        </p>
        <Button
          variant={hidden() ? 'danger' : 'accent'}
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
        </Button>
      </div>
      <Show when={hiddenQuery.isError}>
        <Alert tone="danger">Failed to load current visibility.</Alert>
      </Show>
    </>
  )
}

export default AdminOverlayVisibilitySection

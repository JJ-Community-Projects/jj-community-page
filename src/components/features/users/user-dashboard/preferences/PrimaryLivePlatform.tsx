import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
} from 'solid-js'
import { RadioGroup } from '@kobalte/core/radio-group'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import type { StreamingPlatform } from '../../../../../lib/orpc/private/schemas/users.ts'
import { Alert, Spinner } from '../../../../ui/Status'
import { Button } from '../../../../ui/Button'

const usePrimaryLivePlatform = () => {
  const client = useQueryClient()
  const { getPrimaryLiveStream, updatePrimaryLiveStream } = orpcPrivate.profile
  const { getSocial } = orpcPrivate.social

  // Queries
  const primaryLiveStream = useQuery(() => getPrimaryLiveStream.queryOptions())
  const socials = useQuery(() => getSocial.queryOptions())

  // Single source of truth for the UI selection
  const [selectedPlatform, setSelectedPlatform] =
    createSignal<StreamingPlatform | null>(null)

  // Mutation with optimistic update
  const mutation = useMutation(() =>
    updatePrimaryLiveStream.mutationOptions({
      onMutate: async (vars) => {
        // Optimistically update cache and local state
        setSelectedPlatform(vars.platform)
        await client.cancelQueries({
          queryKey: getPrimaryLiveStream.queryKey(),
        })
        const prev = client.getQueryData<StreamingPlatform>(
          getPrimaryLiveStream.queryKey(),
        )
        client.setQueryData(getPrimaryLiveStream.queryKey(), vars.platform)
        return { prev }
      },
      onError: (_err, _vars, ctx) => {
        // Roll back on error
        if (ctx?.prev)
          client.setQueryData(getPrimaryLiveStream.queryKey(), ctx.prev)
      },
      onSettled: async () => {
        // Ensure server truth wins eventually
        await client.invalidateQueries({
          queryKey: getPrimaryLiveStream.queryKey(),
        })
        await client.invalidateQueries({ queryKey: getSocial.queryKey() })
      },
    }),
  )

  // Sync local state with server data when it arrives/changes
  createEffect(() => {
    const p = primaryLiveStream.data
    if (!p) return
    if (mutation.isPending) return // do not overwrite during mutate
    if (p !== selectedPlatform()) setSelectedPlatform(p)
  })

  const hasPlatformSocial = createMemo(() => {
    const platform = selectedPlatform()
    return platform
      ? (socials.data?.some((s) => s.provider === platform) ?? false)
      : false
  })

  const handlePlatformChange = (platform: StreamingPlatform) => {
    setSelectedPlatform(platform)
    mutation.mutate({ platform })
  }

  const retry = async () =>
    Promise.all([primaryLiveStream.refetch(), socials.refetch()])

  return {
    selectedPlatform,
    hasPlatformSocial,
    handlePlatformChange,
    primaryLiveStream,
    socials,
    mutation,
    retry,
  }
}

const platformOptions: { value: StreamingPlatform; label: string }[] = [
  { value: 'twitch', label: 'Twitch' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
]

export const PrimaryLivePlatform: Component = () => {
  const {
    selectedPlatform,
    handlePlatformChange,
    primaryLiveStream,
    socials,
    mutation,
    retry,
  } = usePrimaryLivePlatform()

  return (
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold">Primary Live Stream Platform</h3>
      <p class="text-fg-muted text-sm">
        Your default platform for live streams. Your JJ profile uses its
        profile picture.
      </p>

      <Show when={primaryLiveStream.isPending || socials.isPending}>
        <Spinner label="Loading platform settings..." class="text-fg-muted" />
      </Show>

      <Show when={primaryLiveStream.error || socials.error}>
        <Alert
          tone="danger"
          action={
            <Button size="sm" onClick={retry}>
              Retry
            </Button>
          }
        >
          Failed to load platform settings
        </Alert>
      </Show>
      <RadioGroup
        value={selectedPlatform() ?? undefined}
        onChange={(s) => handlePlatformChange(s as StreamingPlatform)}
        class="flex flex-wrap gap-1.5"
        disabled={mutation.isPending}
      >
        <For each={platformOptions}>
          {(option) => (
            <RadioGroup.Item value={option.value} class="relative">
              <RadioGroup.ItemInput class="peer" />
              <RadioGroup.ItemLabel class="bg-surface-strong text-fg ring-line-strong hover:bg-surface peer-focus-visible:outline-accent data-checked:bg-accent data-checked:ring-accent data-disabled:opacity-50 inline-flex cursor-pointer items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 data-checked:text-white">
                {option.label}
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
          )}
        </For>
      </RadioGroup>
    </div>
  )
}

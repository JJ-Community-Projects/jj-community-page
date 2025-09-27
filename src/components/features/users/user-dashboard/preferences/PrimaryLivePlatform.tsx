// src/components/features/users/user-dashboard/PrimaryLivePlatform.tsx
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  Show,
} from 'solid-js'
import { RadioGroup } from '@kobalte/core/radio-group'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import type { StreamingPlatform } from '../../../../../lib/orpc/private/schemas/users.ts'

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

export const PrimaryLivePlatform: Component = () => {
  const {
    selectedPlatform,
    hasPlatformSocial,
    handlePlatformChange,
    primaryLiveStream,
    socials,
    mutation,
    retry,
  } = usePrimaryLivePlatform()

  return (
    <div class="">
      <h3 class="mb-2 text-lg font-medium">Primary Live Stream Platform</h3>
      <p class="mb-4 text-gray-600">
        Select your primary live streaming platform. This will be used as your
        default platform for live streams. The Profile picture of your primary
        live stream platform will be used for your JJ profile.
      </p>

      <Show when={primaryLiveStream.isPending || socials.isPending}>
        <div class="py-4 text-center text-gray-500">
          Loading platform settings...
        </div>
      </Show>

      <Show when={primaryLiveStream.error || socials.error}>
        <div class="py-4 text-center">
          <p class="mb-2 text-red-500">Failed to load platform settings</p>
          <button
            onClick={retry}
            class="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </Show>
      <RadioGroup
        value={selectedPlatform() ?? undefined}
        onChange={(s) => handlePlatformChange(s as StreamingPlatform)}
        class="flex flex-row gap-4"
        disabled={mutation.isPending}
      >
        <RadioGroup.Item
          value="twitch"
          class="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-50"
        >
          <RadioGroup.ItemInput />
          <RadioGroup.ItemControl class="h-4 w-4 rounded-full border border-gray-300">
            <RadioGroup.ItemIndicator class="h-2 w-2 rounded-full bg-purple-600" />
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="font-medium text-purple-600">
            Twitch
          </RadioGroup.ItemLabel>
        </RadioGroup.Item>
        <RadioGroup.Item
          value="youtube"
          class="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-50"
        >
          <RadioGroup.ItemInput />
          <RadioGroup.ItemControl class="h-4 w-4 rounded-full border border-gray-300">
            <RadioGroup.ItemIndicator class="h-2 w-2 rounded-full bg-red-600" />
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="font-medium text-red-600">
            YouTube
          </RadioGroup.ItemLabel>
        </RadioGroup.Item>
        <RadioGroup.Item
          value="tiktok"
          class="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-50"
        >
          <RadioGroup.ItemInput />
          <RadioGroup.ItemControl class="h-4 w-4 rounded-full border border-gray-300">
            <RadioGroup.ItemIndicator class="h-2 w-2 rounded-full bg-black" />
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="font-medium text-black">
            TikTok
          </RadioGroup.ItemLabel>
        </RadioGroup.Item>
      </RadioGroup>
    </div>
  )
}

/*

          <Show when={!hasPlatformSocial()}>
            <div class="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
              <p class="text-sm font-medium">
                Warning: You have selected {selectedPlatform()} as your primary
                live stream platform, but you don't have a {selectedPlatform()}{' '}
                account linked. Please add your {selectedPlatform()} account
                below.
              </p>
            </div>
          </Show>
 */

import { type Component, createMemo, createSignal, Show } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { socialUrlRegex } from '../../../../../functions/socialUrlRegex.ts'
import { FaSolidArrowsRotate, FaSolidTrash } from 'solid-icons/fa'
import { PrimaryLivePlatform } from './PrimaryLivePlatform.tsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'

const useHook = () => {
  const queryClient = useQueryClient()

  const socialsQuery = useQuery(() =>
    orpcPrivate.social.getSocial.queryOptions({
      staleTime: 30_000,
    }),
  )

  const importFromTiltify = useMutation(() =>
    orpcPrivate.social.importFromTiltify.mutationOptions({
      onSuccess: async () => {
        // Invalidate and refetch socials after successful add
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.twitch.getTwitchChannel.queryKey(),
        })
      },
    }),
  )

  const twitchChannelQuery = useQuery(() =>
    orpcPrivate.twitch.getTwitchChannel.queryOptions({
      staleTime: 30_000,
    }),
  )

  const addMutation = useMutation(() =>
    orpcPrivate.social.addSocial.mutationOptions({
      onSuccess: async ({ provider }) => {
        // Invalidate and refetch socials after successful add
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.queryKey(),
        })
        if (provider === 'twitch') {
          await queryClient.invalidateQueries({
            queryKey: orpcPrivate.twitch.getTwitchChannel.queryKey(),
          })
        }
      },
      onError: (error) => {
        console.error('Failed to add social:', error)
      },
    }),
  )

  const removeMutation = useMutation(() =>
    orpcPrivate.social.removeSocial.mutationOptions({
      onSuccess: async ({ provider }) => {
        // Invalidate and refetch socials after successful remove
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.queryKey(),
        })
        if (provider === 'twitch') {
          await queryClient.invalidateQueries({
            queryKey: orpcPrivate.twitch.getTwitchChannel.queryKey(),
          })
        }
      },
      onError: (error) => {
        console.error('Failed to remove social:', error)
      },
    }),
  )

  return {
    socialsQuery,
    twitchChannelQuery,
    addMutation,
    removeMutation,
    importFromTiltify,
  }
}

// Error text for a failed mutation, with the server's message when it sent one
const MutationError: Component<{ error: Error | null; fallback: string }> = (
  props,
) => (
  <Show when={props.error}>
    <p class="mt-1 text-sm text-danger-500">
      {props.error?.message || props.fallback}
    </p>
  </Show>
)

// Twitch Social Component
const TwitchSocial: Component = () => {
  const { twitchChannelQuery, addMutation, removeMutation, socialsQuery } =
    useHook()

  const [url, setUrl] = createSignal<string>('')
  const [error, setError] = createSignal<string>('')

  const regexes = socialUrlRegex()

  const twitchChannel = () => twitchChannelQuery.data
  const twitchChannelImg = () =>
    twitchChannelQuery.data?.profileImageUrl?.replace('300x300', '70x70')

  const hasTwitchChannel = () => twitchChannel() !== undefined

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.twitch.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid Twitch URL (e.g., https://twitch.tv/username)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'twitch', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add Twitch URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'twitch'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">Twitch</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-twitch-500 hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'twitch' })}
                class="text-danger-500 hover:text-danger-700"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://twitch.tv/username"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-twitch-500 px-4 py-2 text-white hover:bg-twitch-600 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
      <Show when={twitchChannelQuery.isSuccess && twitchChannelQuery.data}>
        <div class="mt-2 flex items-center rounded-md bg-twitch-50 p-3">
          <img
            class="mr-2 size-5 rounded-full"
            src={twitchChannelImg()}
            alt={twitchChannel()?.displayName || 'Twitch profile'}
          />
          <p class="text-twitch-500">
            Connected to {twitchChannel()?.displayName}
          </p>
        </div>
      </Show>
    </div>
  )
}

// YouTube Social Component
const YouTubeSocial: Component = () => {
  const { twitchChannelQuery, addMutation, removeMutation, socialsQuery } =
    useHook()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')

  const regexes = socialUrlRegex()

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.youtube.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid YouTube URL (e.g., https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'youtube', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add YouTube URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'youtube'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">YouTube</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-danger-600 hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'youtube' })}
                class="text-danger-500 hover:text-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-danger-600 px-4 py-2 text-white hover:bg-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  )
}

// Bluesky Social Component
const BlueSkySocial: Component = () => {
  const { addMutation, removeMutation, socialsQuery } = useHook()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')

  const regexes = socialUrlRegex()

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.bsky.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid Bluesky URL (e.g., https://bsky.app/profile/username.bsky.social, or https://bsky.app/profile/customdomain.com)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'bsky', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add Bluesky URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'bsky'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">Bluesky</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-bluesky-500 hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'bsky' })}
                class="text-danger-500 hover:text-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://bsky.app/profile/user@domain.com, username.bsky.social, or username.customdomain.com"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-bluesky-500 px-4 py-2 text-white hover:bg-bluesky-500 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  )
}

// Twitter Social Component
const TwitterSocial: Component = () => {
  const { addMutation, removeMutation, socialsQuery } = useHook()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')

  const regexes = socialUrlRegex()

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.twitter.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'twitter', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add Twitter URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'twitter'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">Twitter</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent-500 hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'twitter' })}
                class="text-danger-500 hover:text-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://twitter.com/username or https://x.com/username"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  )
}

// TikTok Social Component
const TikTokSocial: Component = () => {
  const { addMutation, removeMutation, socialsQuery } = useHook()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')

  const regexes = socialUrlRegex()

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.tiktok.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'tiktok', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add TikTok URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'tiktok'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">TikTok</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-fg hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'tiktok' })}
                class="text-danger-500 hover:text-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://tiktok.com/@username"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-black px-4 py-2 text-white hover:bg-fg disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  )
}

// Instagram Social Component
const InstagramSocial: Component = () => {
  const { addMutation, removeMutation, socialsQuery } = useHook()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')

  const regexes = socialUrlRegex()

  const validateUrl = (url: string) => {
    if (!url) return true
    return regexes.instagram.test(url)
  }

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError(
        'Please enter a valid Instagram URL (e.g., https://instagram.com/username)',
      )
      return
    }

    try {
      await addMutation.mutateAsync({ provider: 'instagram', url: url() })
      setUrl('')
      setError('')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to add Instagram URL',
      )
    }
  }

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === 'instagram'),
  )

  return (
    <div>
      <h3 class="text-lg font-medium">Instagram</h3>
      <Show
        when={!social()}
        fallback={
          <>
            <div class="flex items-center justify-between rounded-md p-3">
              <a
                href={social()?.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-instagram-500 hover:underline"
              >
                {social()?.url}
              </a>
              <button
                type="button"
                onClick={() => removeMutation.mutate({ provider: 'instagram' })}
                class="text-danger-500 hover:text-danger-700 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash />
              </button>
            </div>
            <MutationError
              error={removeMutation.error}
              fallback="Failed to remove link"
            />
          </>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? 'invalid' : 'valid'}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://instagram.com/username"
                class="w-full rounded-md border p-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="rounded-md bg-instagram-500 px-4 py-2 text-white hover:bg-instagram-600 disabled:cursor-not-allowed disabled:bg-neutral"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="mt-1 text-sm text-danger-500">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  )
}

export const UserSocialsSection: Component = () => {
  // Get user context
  const { importFromTiltify } = useHook()

  return (
    <div class="rounded-tile bg-linear-to-b from-surface to-surface-2 text-fg shadow-tile ring-1 ring-line p-4 sm:p-6">
      <div class="mb-4 flex flex-col items-end">
        <button
          type="button"
          onClick={() => importFromTiltify.mutate()}
          class="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-neutral"
          disabled={importFromTiltify.isPending}
          title="Import social links from Tiltify"
        >
          <FaSolidArrowsRotate
            class={importFromTiltify.isPending ? 'animate-spin' : ''}
          />
          <span>Import from Tiltify</span>
        </button>
        <MutationError
          error={importFromTiltify.error}
          fallback="Failed to import from Tiltify"
        />
      </div>

      <div class="space-y-6">
        {/* Primary Live Stream Platform */}
        <PrimaryLivePlatform />

        {/* Social Media Components */}
        <TwitchSocial />
        <YouTubeSocial />
        <BlueSkySocial />
        <TwitterSocial />
        <TikTokSocial />
        <InstagramSocial />
      </div>
    </div>
  )
}

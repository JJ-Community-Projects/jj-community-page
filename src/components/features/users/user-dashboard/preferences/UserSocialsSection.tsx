import { type Component, createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { TextField } from '@kobalte/core/text-field'
import {
  FaBrandsInstagram,
  FaBrandsTiktok,
  FaBrandsTwitch,
  FaBrandsTwitter,
  FaBrandsYoutube,
  FaSolidArrowsRotate,
  FaSolidLink,
  FaSolidTrash,
} from 'solid-icons/fa'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { socialUrlRegex } from '../../../../../functions/socialUrlRegex.ts'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { BskyIcon } from '../../../../common/icons/JJIcons.tsx'
import { PrimaryLivePlatform } from './PrimaryLivePlatform.tsx'
import { Section } from '../../../../ui/Tile'
import { Button, IconButton } from '../../../../ui/Button'
import { fieldClass } from '../../../../ui/Form'
import { Alert } from '../../../../ui/Status'
import { Avatar } from '../../../../ui/Avatar'
import { cn, groupSurface } from '../../../../ui/cn'

const useSocials = () => {
  const queryClient = useQueryClient()

  const socialsQuery = useQuery(() =>
    orpcPrivate.social.getSocial.queryOptions({
      staleTime: 30_000,
    }),
  )

  const twitchChannelQuery = useQuery(() =>
    orpcPrivate.twitch.getTwitchChannel.queryOptions({
      staleTime: 30_000,
    }),
  )

  // A change to the Twitch link changes the connected channel too
  const refresh = async (provider?: string) => {
    await queryClient.invalidateQueries({
      queryKey: orpcPrivate.social.getSocial.queryKey(),
    })
    if (!provider || provider === 'twitch') {
      await queryClient.invalidateQueries({
        queryKey: orpcPrivate.twitch.getTwitchChannel.queryKey(),
      })
    }
  }

  const importFromTiltify = useMutation(() =>
    orpcPrivate.social.importFromTiltify.mutationOptions({
      onSuccess: () => refresh(),
    }),
  )

  const addMutation = useMutation(() =>
    orpcPrivate.social.addSocial.mutationOptions({
      onSuccess: ({ provider }) => refresh(provider),
    }),
  )

  const removeMutation = useMutation(() =>
    orpcPrivate.social.removeSocial.mutationOptions({
      onSuccess: ({ provider }) => refresh(provider),
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

type Provider = 'twitch' | 'youtube' | 'bsky' | 'twitter' | 'tiktok' | 'instagram'

type Platform = {
  provider: Provider
  name: string
  /** In the "valid URL" error, when it differs from the name */
  urlName?: string
  icon: Component<{ class?: string }>
  /** Literal class, so Tailwind finds it */
  iconClass: string
  regex: keyof ReturnType<typeof socialUrlRegex>
  placeholder: string
  example: string
}

const platforms: Platform[] = [
  {
    provider: 'twitch',
    name: 'Twitch',
    icon: FaBrandsTwitch,
    iconClass: 'text-twitch',
    regex: 'twitch',
    placeholder: 'https://twitch.tv/username',
    example: 'https://twitch.tv/username',
  },
  {
    provider: 'youtube',
    name: 'YouTube',
    icon: FaBrandsYoutube,
    iconClass: 'text-youtube',
    regex: 'youtube',
    placeholder: 'https://youtube.com/@username',
    example:
      'https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID',
  },
  {
    provider: 'bsky',
    name: 'Bluesky',
    icon: BskyIcon,
    iconClass: 'text-bluesky',
    regex: 'bsky',
    placeholder: 'https://bsky.app/profile/username.bsky.social',
    example:
      'https://bsky.app/profile/username.bsky.social, or https://bsky.app/profile/customdomain.com',
  },
  {
    provider: 'twitter',
    name: 'Twitter',
    urlName: 'Twitter/X',
    icon: FaBrandsTwitter,
    iconClass: 'text-twitter',
    regex: 'twitter',
    placeholder: 'https://x.com/username',
    example: 'https://twitter.com/username or https://x.com/username',
  },
  {
    provider: 'tiktok',
    name: 'TikTok',
    icon: FaBrandsTiktok,
    iconClass: 'text-fg',
    regex: 'tiktok',
    placeholder: 'https://tiktok.com/@username',
    example: 'https://tiktok.com/@username',
  },
  {
    provider: 'instagram',
    name: 'Instagram',
    icon: FaBrandsInstagram,
    iconClass: 'text-instagram',
    regex: 'instagram',
    placeholder: 'https://instagram.com/username',
    example: 'https://instagram.com/username',
  },
]

/**
 * One platform: brand icon · name (h3) · the linked URL with a remove button, or a URL input with
 * Add. The browser tests scope to the h3's parent, this row.
 */
const SocialRow: Component<{ platform: Platform }> = (props) => {
  const { socialsQuery, twitchChannelQuery, addMutation, removeMutation } =
    useSocials()
  const [url, setUrl] = createSignal('')
  const [error, setError] = createSignal('')
  const regexes = socialUrlRegex()

  const social = createMemo(() =>
    socialsQuery.data?.find((s) => s.provider === props.platform.provider),
  )

  const handleAdd = async () => {
    if (url() && !regexes[props.platform.regex].test(url())) {
      setError(
        `Please enter a valid ${props.platform.urlName ?? props.platform.name} URL (e.g., ${props.platform.example})`,
      )
      return
    }
    try {
      await addMutation.mutateAsync({
        provider: props.platform.provider,
        url: url(),
      })
      setUrl('')
      setError('')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to add ${props.platform.name} URL`,
      )
    }
  }

  const twitchChannel = () =>
    props.platform.provider === 'twitch' && twitchChannelQuery.isSuccess
      ? twitchChannelQuery.data
      : undefined

  return (
    <div
      class={cn(
        groupSurface,
        'flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3',
      )}
    >
      <h3 class="flex h-9 shrink-0 items-center gap-2 text-sm font-semibold sm:w-32">
        <Dynamic
          component={props.platform.icon}
          class={cn('size-4 shrink-0', props.platform.iconClass)}
          aria-hidden="true"
        />
        {props.platform.name}
      </h3>
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <Show
          when={social()}
          fallback={
            <TextField
              value={url()}
              onChange={setUrl}
              validationState={error() ? 'invalid' : 'valid'}
              class="flex flex-col gap-1"
            >
              <div class="flex items-center gap-2">
                <TextField.Input
                  aria-label={`${props.platform.name} URL`}
                  placeholder={props.platform.placeholder}
                  class={cn(fieldClass.input, 'h-9')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAdd()
                    }
                  }}
                />
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleAdd}
                  disabled={addMutation.isPending || !url()}
                >
                  Add
                </Button>
              </div>
              <TextField.ErrorMessage class={fieldClass.error}>
                {error()}
              </TextField.ErrorMessage>
            </TextField>
          }
        >
          {(linked) => (
            <div class="flex min-h-9 items-center gap-2">
              <FaSolidLink
                class="text-fg-muted size-3 shrink-0"
                aria-hidden="true"
              />
              <a
                href={linked().url}
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-0 flex-1 truncate text-sm hover:underline"
              >
                {linked().url}
              </a>
              <IconButton
                variant="ghost"
                size="sm"
                class="text-danger-600"
                aria-label={`Remove ${props.platform.name} link`}
                onClick={() =>
                  removeMutation.mutate({ provider: props.platform.provider })
                }
                disabled={removeMutation.isPending}
              >
                <FaSolidTrash class="size-3.5" aria-hidden="true" />
              </IconButton>
            </div>
          )}
        </Show>
        <Show when={removeMutation.error}>
          <p class={fieldClass.error}>
            {removeMutation.error?.message || 'Failed to remove link'}
          </p>
        </Show>
        <Show when={twitchChannel()}>
          {(channel) => (
            <p class="text-fg-muted flex items-center gap-2 text-sm">
              <Avatar
                src={channel().profileImageUrl?.replace('300x300', '70x70')}
                alt=""
                size="xs"
                shape="circle"
              />
              Connected to {channel().displayName}
            </p>
          )}
        </Show>
      </div>
    </div>
  )
}

export const UserSocialsSection: Component = () => {
  const { importFromTiltify } = useSocials()

  return (
    <Section
      title="Social Links"
      icon={<FaSolidLink />}
      action={
        <Button
          variant="accent"
          size="sm"
          onClick={() => importFromTiltify.mutate()}
          disabled={importFromTiltify.isPending}
          title="Import social links from Tiltify"
        >
          <FaSolidArrowsRotate
            class={cn(
              'size-3',
              importFromTiltify.isPending && 'animate-spin',
            )}
            aria-hidden="true"
          />
          Import from Tiltify
        </Button>
      }
    >
      <div class="flex flex-col gap-3">
        <Show when={importFromTiltify.error}>
          <Alert tone="danger">
            {importFromTiltify.error?.message ||
              'Failed to import from Tiltify'}
          </Alert>
        </Show>
        <PrimaryLivePlatform />
        <div class="flex flex-col gap-2">
          <For each={platforms}>
            {(platform) => <SocialRow platform={platform} />}
          </For>
        </div>
      </div>
    </Section>
  )
}

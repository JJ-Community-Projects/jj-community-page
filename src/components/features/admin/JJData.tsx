import { type Component, createSignal, For, type JSX, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/Dialog'
import { TileGroup } from '../../ui/Tile'
import { Spinner } from '../../ui/Status'
import { adminLink, MutationStatus } from './common/AdminSection'

export const JJData: Component = () => {
  const client = useQueryClient()
  const jjData = orpcPrivate.jj
  const admin = orpcPrivate.admin
  const [confirming, setConfirming] = createSignal<'invalid' | 'jjData' | null>(null)

  const refresh = useMutation(() =>
    admin.refreshJJAPIData.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: jjData.causes.queryKey() })
        await client.invalidateQueries({
          queryKey: admin.getAllTwitchChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getAllYoutubeChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getAllLiveChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getInvalidTwitchChannels.queryKey(),
        })
      },
    }),
  )

  // Queries
  const causes = useQuery(() => jjData.causes.queryOptions())
  const allTwitchChannels = useQuery(() =>
    admin.getAllTwitchChannels.queryOptions(),
  )
  const allYoutubeChannels = useQuery(() =>
    admin.getAllYoutubeChannels.queryOptions(),
  )
  const allLiveChannels = useQuery(() =>
    admin.getAllLiveChannels.queryOptions(),
  )
  const invalidTwitchChannels = useQuery(() =>
    admin.getInvalidTwitchChannels.queryOptions(),
  )

  // Mutations
  const validateTwitchChannels = useMutation(() =>
    admin.validateTwitchChannels.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: admin.getAllTwitchChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getInvalidTwitchChannels.queryKey(),
        })
      },
    }),
  )

  const checkLiveStreams = useMutation(() =>
    admin.checkLiveStreams.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: admin.getAllLiveChannels.queryKey(),
        })
      },
    }),
  )

  const clearInvalidTwitchChannels = useMutation(() =>
    admin.clearInvalidTwitchChannels.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: admin.getInvalidTwitchChannels.queryKey(),
        })
      },
    }),
  )

  const clearJJData = useMutation(() =>
    admin.clearJingleJamData.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: jjData.causes.queryKey() })
        await client.invalidateQueries({
          queryKey: admin.getAllTwitchChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getAllYoutubeChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getAllLiveChannels.queryKey(),
        })
        await client.invalidateQueries({
          queryKey: admin.getInvalidTwitchChannels.queryKey(),
        })
      },
    }),
  )

  const twitchHref = (login: string) => `https://twitch.tv/${login}`
  const youtubeHref = (login: string) =>
    String(login).startsWith('http')
      ? String(login)
      : `https://youtube.com/@${login}`

  return (
    <>
      <div class="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="accent" onClick={() => refresh.mutate(undefined)}>
          Refresh JJ API Data
        </Button>
        <MutationStatus status={refresh.status} />
        <Button size="sm" onClick={() => validateTwitchChannels.mutate()}>
          Validate Twitch Channels
        </Button>
        <MutationStatus status={validateTwitchChannels.status} />
        <Button size="sm" onClick={() => checkLiveStreams.mutate()}>
          Check Live Streams
        </Button>
        <MutationStatus status={checkLiveStreams.status} />
        <Button size="sm" variant="danger" onClick={() => setConfirming('invalid')}>
          Clear Invalid Twitch Channels
        </Button>
        <MutationStatus status={clearInvalidTwitchChannels.status} />
        <Button size="sm" variant="danger" onClick={() => setConfirming('jjData')}>
          Clear JJ Data
        </Button>
        <MutationStatus status={clearJJData.status} />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelList title="All Twitch Channels" channels={allTwitchChannels.data} href={twitchHref} />
        <ChannelList title="All YouTube Channels" channels={allYoutubeChannels.data} href={youtubeHref} />
        <ChannelList title="Live Channels" channels={allLiveChannels.data} href={twitchHref} />
        <ChannelList title="Invalid Twitch Channels" channels={invalidTwitchChannels.data} href={twitchHref} />
      </div>

      <Show when={causes.data}>
        {(causes) => (
          <div class="flex flex-col gap-3">
            <h3 class="font-semibold">Causes</h3>
            <For each={causes().causes}>
              {(cause) => (
                <TileGroup pad="md" class="flex flex-col gap-3">
                  <div class="flex items-start gap-4">
                    <img
                      src={cause.logo}
                      alt={`${cause.name} logo`}
                      class="rounded-media bg-surface size-16 flex-none object-contain"
                    />
                    <div class="min-w-0 flex-1">
                      <h4 class="text-lg font-semibold">{cause.name}</h4>
                      <p class="text-fg-muted text-xs">ID: {cause.id}</p>
                      <div class="mt-1 flex flex-wrap gap-3 text-sm">
                        <a href={cause.url} target="_blank" rel="noopener noreferrer" class={adminLink}>
                          Website
                        </a>
                        <a href={cause.donateUrl} target="_blank" rel="noopener noreferrer" class={adminLink}>
                          Donate
                        </a>
                      </div>
                    </div>
                    {/* One figure: `raised` is the cause total (the old three boxes all showed it) */}
                    <div class="text-raised shrink-0 text-right text-sm font-bold">
                      <p class="text-xxs">Raised</p>
                      <p>{cause.raised.gbpFormatted}</p>
                      <p class="text-fg-muted text-xs font-semibold">{cause.raised.usdFormatted}</p>
                    </div>
                  </div>
                  <p class="text-sm whitespace-pre-line">{cause.description}</p>
                </TileGroup>
              )}
            </For>
          </div>
        )}
      </Show>

      <ConfirmDialog
        open={confirming() === 'invalid'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Clear Invalid Twitch Channels"
        text={<>Empties the list of Twitch logins that failed validation.</>}
        confirmLabel="Clear"
        onConfirm={() => {
          setConfirming(null)
          clearInvalidTwitchChannels.mutate()
        }}
      />
      <ConfirmDialog
        open={confirming() === 'jjData'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Clear JJ Data"
        text={<>Wipes the stored Jingle Jam API cache. Refresh JJ API Data fills it again.</>}
        confirmLabel="Clear"
        onConfirm={() => {
          setConfirming(null)
          clearJJData.mutate()
        }}
      />
    </>
  )
}

const ChannelList: Component<{
  title: string
  channels: string[] | undefined
  href: (login: string) => string
}> = (props): JSX.Element => (
  <TileGroup pad="md" class="flex min-w-0 flex-col gap-2">
    <h3 class="flex items-baseline justify-between gap-2 font-semibold">
      {props.title}
      <Show when={props.channels}>
        {(channels) => (
          <span class="text-fg-muted text-xs font-normal">{channels().length}</span>
        )}
      </Show>
    </h3>
    <Show when={props.channels} fallback={<Spinner label="Loading…" class="text-fg-muted" />}>
      {(channels) => (
        <ul class="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
          <For each={channels()}>
            {(login) => (
              <li class="truncate">
                <a class={adminLink} href={props.href(login)} target="_blank" rel="noreferrer">
                  {login}
                </a>
              </li>
            )}
          </For>
        </ul>
      )}
    </Show>
  </TileGroup>
)

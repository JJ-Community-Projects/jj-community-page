import { type Component, createEffect, For, on, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'

export const JJData: Component = () => {
  const client = useQueryClient()
  const jjData = orpcPrivate.jj
  const admin = orpcPrivate.admin

  const refresh = useMutation(() =>
    admin.refreshJJAPIData.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: jjData.causes.queryKey() })
        await client.invalidateQueries({ queryKey: admin.getAllTwitchChannels.queryKey() })
        await client.invalidateQueries({ queryKey: admin.getAllLiveChannels.queryKey() })
      },
    }),
  )

  // Queries
  const causes = useQuery(() => jjData.causes.queryOptions())
  const allTwitchChannels = useQuery(() => admin.getAllTwitchChannels.queryOptions())
  const allLiveChannels = useQuery(() => admin.getAllLiveChannels.queryOptions())

  // Mutations
  const validateTwitchChannels = useMutation(() =>
    admin.validateTwitchChannels.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: admin.getAllTwitchChannels.queryKey() })
      },
    }),
  )

  const checkLiveStreams = useMutation(() =>
    admin.checkLiveStreams.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: admin.getAllLiveChannels.queryKey() })
      },
    }),
  )

  // const campaigns = useQuery(() => jjData.campaigns.queryOptions())

  createEffect(
    on(
      () => causes.data,
      (d) => {
        console.log('causes.data', d)
      },
    ),
  )
  createEffect(
    on(
      () => causes.error,
      (d) => {
        console.log('causes.error', d)
      },
    ),
  )

  return (
    <div class="flex flex-col text-black gap-4">
      <div class="flex items-center gap-2">
        <button class={'bg-accent text-white px-3 py-1 rounded'} onClick={refresh.mutate}>
          Refresh JJ API Data
        </button>
        <span class="text-sm text-gray-600">{refresh.status}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => validateTwitchChannels.mutate()}>
          Validate Twitch Channels
        </button>
        <span class="text-xs text-gray-600">{validateTwitchChannels.status}</span>
        <button class="bg-purple-600 text-white px-3 py-1 rounded" onClick={() => checkLiveStreams.mutate()}>
          Check Live Streams
        </button>
        <span class="text-xs text-gray-600">{checkLiveStreams.status}</span>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="font-semibold mb-2">All Twitch Channels</h3>
          <Show when={allTwitchChannels.data} fallback={<p class="text-sm text-gray-500">Loading…</p>}>
            {(d) => (
              <ul class="list-disc pl-5 space-y-1">
                <For each={d()}>{(login) => (
                  <li class="text-sm">
                    <a class="text-accent underline" href={`https://twitch.tv/${login}`} target="_blank" rel="noreferrer">
                      {login}
                    </a>
                  </li>
                )}</For>
              </ul>
            )}
          </Show>
        </div>

        <div class="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="font-semibold mb-2">Live Channels</h3>
          <Show when={allLiveChannels.data} fallback={<p class="text-sm text-gray-500">Loading…</p>}>
            {(d) => (
              <ul class="list-disc pl-5 space-y-1">
                <For each={d()}>{(login) => (
                  <li class="text-sm">
                    <a class="text-accent underline" href={`https://twitch.tv/${login}`} target="_blank" rel="noreferrer">
                      {login}
                    </a>
                  </li>
                )}</For>
              </ul>
            )}
          </Show>
        </div>
      </div>

      <Show when={causes.data}>
        {(causes) => {
          return (
            <For each={causes().list}>
              {(cause) => {
                return (
                  <div class="my-4 rounded border border-gray-200 bg-white p-4 shadow-sm">
                    <div class="flex items-start gap-4">
                      <img src={cause.logo} alt={`${cause.name} logo`} class="h-16 w-16 flex-none rounded object-contain bg-gray-50" />
                      <div class="min-w-0">
                        <p class="text-lg font-semibold">{cause.name}</p>
                        <p class="text-xs text-gray-500">ID: {cause.id}</p>
                      </div>
                    </div>

                    <div class="mt-3 whitespace-pre-line text-sm text-gray-800">
                      {cause.description}
                    </div>

                    <div class="mt-3 flex flex-wrap gap-3 text-sm">
                      <a href={cause.url} target="_blank" rel="noopener noreferrer" class="text-accent underline">Website</a>
                      <a href={cause.donateUrl} target="_blank" rel="noopener noreferrer" class="text-accent underline">Donate</a>
                    </div>

                    <div class="mt-4 grid gap-3 sm:grid-cols-3">
                      <div class="rounded border border-gray-100 p-3">
                        <p class="text-xs font-medium text-gray-500">Yogscast Raised</p>
                        <p class="text-sm">GBP: {cause.raised.yogscast.gbpFormatted}</p>
                        <p class="text-sm">USD: {cause.raised.yogscast.usdFormatted}</p>
                      </div>
                      <div class="rounded border border-gray-100 p-3">
                        <p class="text-xs font-medium text-gray-500">Fundraisers Raised</p>
                        <p class="text-sm">GBP: {cause.raised.fundraisers.gbpFormatted}</p>
                        <p class="text-sm">USD: {cause.raised.fundraisers.usdFormatted}</p>
                      </div>
                      <div class="rounded border border-gray-100 p-3">
                        <p class="text-xs font-medium text-gray-500">Total Raised</p>
                        <p class="text-sm">GBP: {cause.raised.total.gbpFormatted}</p>
                        <p class="text-sm">USD: {cause.raised.total.usdFormatted}</p>
                      </div>
                    </div>
                  </div>
                )
              }}
            </For>
          )
        }}
      </Show>
    </div>
  )
}

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
        await client.invalidateQueries({
          queryKey: jjData.causes.queryKey(),
        })
        /*
        await client.invalidateQueries({
          queryKey: jjData.campaigns.queryKey(),
        }*/
      },
    }),
  )

  const causes = useQuery(() => jjData.causes.queryOptions())
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
    <div class="flex flex-col text-black">
      <button class={'bg-accent text-white'} onClick={refresh.mutate}>
        Refresh
      </button>
      <p>{causes.status}</p>
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

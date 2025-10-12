import { type Component, createEffect, on, Show } from 'solid-js'
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
      <Show when={causes.error}>
        {(e) => <p>{JSON.stringify(e, null, 2)}</p>}
      </Show>
      <Show when={causes.data}>
        {(data) => {
          return (
            <>
              <p>Causes:</p>
              <pre>{JSON.stringify(data(), null, 2)}</pre>
            </>
          )
        }}
      </Show>
    </div>
  )
}

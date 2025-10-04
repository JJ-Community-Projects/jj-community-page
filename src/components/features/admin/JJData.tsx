import { type Component } from 'solid-js'
import { orpcPrivate, orpcPublic } from '../../../lib/orpc/client.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'

export const JJData: Component = () => {
  const client = useQueryClient()
  const jjData = orpcPublic.jjData
  const admin = orpcPrivate.admin

  const refresh = useMutation(() =>
    admin.refreshJJAPIData.mutationOptions({
      onSuccess: () => {
        client.invalidateQueries({
          queryKey: jjData.causes.queryKey(),
        })
        client.invalidateQueries({
          queryKey: jjData.causes.queryKey(),
        })
      },
    }),
  )

  const causes = useQuery(() => jjData.causes.queryOptions())
  const campaigns = useQuery(() => jjData.campaigns.queryOptions())

  return (
    <div class="flex flex-col">
      <button onClick={refresh.mutate}>Refresh</button>
      <pre>{JSON.stringify(causes?.data, null, 2)}</pre>
      <pre>{JSON.stringify(campaigns?.data, null, 2)}</pre>
    </div>
  )
}

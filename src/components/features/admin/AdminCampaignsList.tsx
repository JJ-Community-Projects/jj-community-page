import { type Component, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client'
import { QueryComponent } from '../../common/QueryComponent'

export const AdminCampaignsList: Component = () => {

  return (
    <div class="rounded border border-gray-300 bg-white p-4">
      <h2 class="mb-2 text-lg font-semibold">All Campaigns</h2>
      <QueryComponent queryOptions={() => orpcPrivate.jj.campaignsAll.queryOptions()}>
        {(campaigns) => (
          <Show
            when={campaigns.count > 0}
            fallback={<p class="text-sm text-gray-500">No campaigns found.</p>}
          >
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="py-2 pr-4"></th>
                    <th class="py-2 pr-4">Campaign ({campaigns.count})</th>
                    <th class="py-2 pr-4">Tiltify</th>
                    <th class="py-2 pr-4">Twitch</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={campaigns.list}>{(c, i) => (
                    <tr class="border-b last:border-b-0 align-top">
                      <td class="py-2 pr-4">{i()+1}</td>
                      <td class="py-2 pr-4">
                        <div class="flex items-center gap-2">
                          <img src={c.avatar} alt="avatar" class="h-8 w-8 rounded object-cover" />
                          <div class="min-w-0">
                            <div class="font-medium line-clamp-1" title={c.campaignName}>{c.campaignName}</div>
                            <div class="text-xs text-gray-500">{c.tiltifySlug}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-2 pr-4">
                        <a
                          href={c.tiltifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          class="text-accent hover:underline"
                        >
                          {c.tiltifyName}
                        </a>
                      </td>
                      <td class="py-2 pr-4">
                        <Show when={c.twitch} fallback={<span class="text-gray-500">—</span>}>
                          {(login) => (
                            <a
                              href={`https://twitch.tv/${login()}`}
                              target="_blank"
                              rel="noreferrer"
                              class="inline-flex items-center gap-2 text-accent hover:underline"
                            >
                              <span>{login()}</span>
                              <span class={c.isTwitchLive ? 'text-green-700' : 'text-gray-500'}>
                                {c.isTwitchLive ? 'LIVE' : 'offline'}
                              </span>
                            </a>
                          )}
                        </Show>
                      </td>
                    </tr>
                  )}</For>
                </tbody>
              </table>
            </div>
          </Show>
        )}
      </QueryComponent>
    </div>
  )
}

export default AdminCampaignsList

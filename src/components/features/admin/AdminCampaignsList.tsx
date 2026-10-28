import { type Component, For, Show } from 'solid-js'
import { orpcPrivate } from '../../../lib/orpc/client'
import { QueryComponent } from '../../common/QueryComponent'
import { Avatar } from '../../ui/Avatar'
import { LiveBadge } from '../../ui/Labels'
import { EmptyState, Spinner } from '../../ui/Status'
import { cn } from '../../ui/cn'
import { adminLink, adminTable } from './common/AdminSection'

export const AdminCampaignsList: Component = () => {

  return (
    <QueryComponent
      queryOptions={() => orpcPrivate.jj.campaignsAll.queryOptions()}
      loading={() => <Spinner label="Loading…" />}
    >
      {(campaigns) => (
        <Show
          when={campaigns.count > 0}
          fallback={<EmptyState title="No campaigns found." />}
        >
          <div class={adminTable.wrap}>
            <table class={adminTable.table}>
              <thead class={adminTable.head}>
                <tr>
                  <th class={adminTable.th}></th>
                  <th class={adminTable.th}>Campaign ({campaigns.count})</th>
                  <th class={adminTable.th}>Tiltify</th>
                  <th class={adminTable.th}>Twitch</th>
                </tr>
              </thead>
              <tbody>
                <For each={campaigns.list}>{(c, i) => (
                  <tr class={adminTable.row}>
                    <td class={cn(adminTable.td, 'text-fg-muted')}>{i() + 1}</td>
                    <td class={adminTable.td}>
                      <div class="flex items-center gap-2">
                        <Avatar src={c.avatar} alt="" fallback={c.campaignName.charAt(0)} size="sm" />
                        <div class="min-w-0">
                          <div class="line-clamp-1 font-semibold" title={c.campaignName}>{c.campaignName}</div>
                          <div class="text-fg-muted text-xs">{c.tiltifySlug}</div>
                        </div>
                      </div>
                    </td>
                    <td class={adminTable.td}>
                      <a
                        href={c.tiltifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        class={adminLink}
                      >
                        {c.tiltifyName}
                      </a>
                    </td>
                    <td class={adminTable.td}>
                      <Show when={c.twitch} fallback={<span class="text-fg-muted">—</span>}>
                        {(login) => (
                          <span class="inline-flex items-center gap-2">
                            <a
                              href={`https://twitch.tv/${login()}`}
                              target="_blank"
                              rel="noreferrer"
                              class={adminLink}
                            >
                              {login()}
                            </a>
                            <Show when={c.isTwitchLive} fallback={<span class="text-fg-muted text-xs">offline</span>}>
                              <LiveBadge />
                            </Show>
                          </span>
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
  )
}

export default AdminCampaignsList

import { type Component, For, Show } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { CommunityFundraiserItem } from '../community/CommunityFundraiserItem.tsx'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/Status'

export const CommunityCampaignGrid: Component = () => {
  const { fundraisers, currency, clearSelectedTags } = useCommunityPage()

  return (
    <div class="flex w-full flex-col gap-3">
      <h2 class="text-on-canvas text-lg font-semibold">Fundraisers</h2>
      <Show
        when={fundraisers().length > 0}
        fallback={
          <EmptyState
            title="No fundraisers match the selected tags."
            action={
              <Button size="sm" onClick={() => clearSelectedTags()}>
                Clear selected tags
              </Button>
            }
          />
        }
      >
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <For each={fundraisers()}>
            {(fundraiser) => (
              <CommunityFundraiserItem
                fundraiser={fundraiser}
                currency={currency()}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

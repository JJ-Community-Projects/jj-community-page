import { type Component, For } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import type { JJCampaignType } from '../../../lib/orpc/private/jjData/contract.ts'
import { FundraiserCard } from '../community/FundraiserCard.tsx'
import { CommunityUsers } from './CommunityUsers.tsx'

export const CommunityCampaignGrid: Component = () => {
  const { campaignsSorted, currency } = useCommunityPage()

  return (
    <div class="flex w-full flex-col gap-3">
      <h2 class="text-on-canvas text-lg font-semibold">Fundraisers</h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <For each={campaignsSorted()}>
          {(campaign: JJCampaignType) => (
            <FundraiserCard campaign={campaign} currency={currency()} />
          )}
        </For>
      </div>
      <CommunityUsers />
    </div>
  )
}

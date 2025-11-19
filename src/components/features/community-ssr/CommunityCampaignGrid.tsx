import { type Component, For } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { twMerge } from 'tailwind-merge'
import type { JJCampaignType } from '../../../lib/orpc/private/jjData/contract.ts'
import { CommunityItem } from './CommunityItem.tsx'
import { CommunityUsers } from './CommunityUsers.tsx'

export const CommunityCampaignGrid: Component = () => {
  const { campaignsSorted } = useCommunityPage()

  return (
    <div class={twMerge('mx-auto flex w-full flex-col gap-4')}>
      <div
        class={twMerge(
          'mb-2 mt-6 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2',
        )}
      >
        <div class={'flex flex-col'}>
          <h2 class={twMerge('text-lg font-semibold text-white')}>
            Fundraisers (2024)
          </h2>
          <p class={twMerge('text-white')}>
            2025 Fundraisers will be shown after the Jingle Jam has started.
          </p>
        </div>
      </div>
      <div
        class={
          'grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] content-center gap-2'
        }
      >
        <For each={campaignsSorted()}>
          {(campaign: JJCampaignType) => {
            return <CommunityItem campaign={campaign} />
          }}
        </For>
      </div>
      <CommunityUsers />
    </div>
  )
}


/*

        <For each={campaignsSorted()}>
          {(campaign: JJCampaignType) => {
            return <CommunityItem campaign={campaign} />
          }}
        </For>
      </div>
      <CommunityUsers />
 */

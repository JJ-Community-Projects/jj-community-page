import { type Component, For } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { twMerge } from 'tailwind-merge'
import { CommunityCauseCard } from './CommunityCauseCard.tsx'
import { CommunityItem } from './CommunityItem.tsx'
import { CurrencySelection, SortSelection } from './CommunitySelection.tsx'

export const CommunityCampaignGridByCause: Component = () => {
  const { campaignsByCause, campaignsByCauseFiltered, selectedTagIds } =
    useCommunityPage()
  const anyTagsSelected = () => selectedTagIds().length > 0
  const groups = () =>
    anyTagsSelected() ? campaignsByCauseFiltered() : campaignsByCause()

  return (
    <div class={twMerge('flex w-full flex-col gap-4')}>
      <div
        class={twMerge(
          'mb-2 mt-6 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2',
        )}
      >
        <h2 class={twMerge('text-lg font-semibold text-white')}>Fundraisers</h2>
        <div
          class={twMerge(
            'flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:w-auto',
          )}
        >
          <SortSelection />
          <CurrencySelection />
        </div>
      </div>
      <div class={'flex w-full flex-col items-center gap-6 text-center'}>
        <For each={groups()}>
          {(o) => {
            const { cause, campaigns } = o
            return (
              <div class={'flex w-full max-w-6xl flex-col items-center gap-8'}>
                <CommunityCauseCard cause={cause} />
                <div
                  class={
                    'grid w-full grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] content-center gap-4'
                  }
                >
                  <For each={campaigns}>
                    {(campaign) => <CommunityItem campaign={campaign} />}
                  </For>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

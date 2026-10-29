import { type Component, For, Show } from 'solid-js'
import { createI18n, I18nProvider } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { useIsBeforeJJ, useIsJJ } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import {
  type CauseGroup,
  CommunityPageProvider,
  useCommunityPage,
} from './CommunityPageProvider.tsx'
import { UpcomingStreams } from './UpcomingStreams.tsx'
import { CommunityFundraiserItem } from './CommunityFundraiserItem.tsx'
import { CommunityCauseCard } from './CommunityCauseCard.tsx'
import { CommunityTagSearch } from './CommunityTagSearch.tsx'
import type { CharitiesStatic } from '../../../content/schema.ts'
import {
  CommunityCharitiesOverview,
  CommunityCharitiesOverviewMobile,
  sidebarNeighbour,
} from '../../common/charityOverview/CommunityCharitiesOverview.tsx'
import { CharityOverviewProvider } from '../../common/charityOverview/CharityOverviewProvider.tsx'
import { CurrencyProvider } from '../../common/CurrencyProvider.tsx'
import { HeadlinerTicker } from '../schedules/common/HeadlinerTicker.tsx'
import { TagCatalogContext } from '../../../lib/useTagSearch.ts'
import type { CatalogTag } from '../../../lib/tagCatalog.ts'
import { JJStartCountdown } from '../../ui/Countdown'
import { Segmented } from '../../ui/Form'
import { Button } from '../../ui/Button'
import { DateDivider } from '../../ui/Labels'
import { Alert, EmptyState, Spinner } from '../../ui/Status'
import { Tile } from '../../ui/Tile'

export const CommunityPage: Component<{
  charitiesData?: CharitiesStatic
  tagCatalog?: CatalogTag[]
}> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CurrencyProvider>
          <CommunityPageProvider>
            <CharityOverviewProvider charitiesData={props.charitiesData}>
              <TagCatalogContext.Provider value={props.tagCatalog}>
                <_CommunityPage />
              </TagCatalogContext.Provider>
            </CharityOverviewProvider>
          </CommunityPageProvider>
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

const _CommunityPage: Component = () => {
  const isJJ = useIsJJ()
  const isBefore = useIsBeforeJJ()
  const { community } = useCommunityPage()

  return (
    <>
      <Show when={community.isSuccess}>
        <Show when={community.data!.list.length > 0}>
          <Body />
        </Show>
        <Show when={community.data!.list.length === 0}>
          <Tile class="flex flex-col items-center gap-2">
            <EmptyState
              title={
                isBefore()
                  ? 'Check this site again once the Jingle Jam has officially started.'
                  : 'No fundraisers found.'
              }
            />
            <Show when={!isJJ()}>
              <JJStartCountdown />
            </Show>
          </Tile>
        </Show>
      </Show>
      <Show when={community.isLoading}>
        <Tile class="flex justify-center">
          <Spinner size="md" label="Loading fundraisers…" />
        </Tile>
      </Show>
      <Show when={community.isError}>
        <Alert tone="danger">Failed to load community campaigns.</Alert>
      </Show>
    </>
  )
}

/** Sort and currency, shared by both fundraiser views. */
export const FundraiserToolbar: Component<{ title: string }> = (props) => {
  const { sortBy, setSortBy, currency, setCurrency } = useCommunityPage()
  return (
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-on-canvas text-lg font-semibold">{props.title}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <Segmented
          label="Sort fundraisers by"
          size="sm"
          value={sortBy()}
          onChange={(value) => setSortBy(value as ReturnType<typeof sortBy>)}
          options={[
            { value: 'raised', label: 'Raised' },
            { value: 'live', label: 'Live' },
            { value: 'cause', label: 'Cause' },
          ]}
        />
        <Segmented
          label="Currency"
          size="sm"
          value={currency()}
          onChange={(value) =>
            setCurrency(value as ReturnType<typeof currency>)
          }
          options={[
            { value: 'GBP', label: 'GBP' },
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
          ]}
        />
      </div>
    </div>
  )
}

const Body: Component = () => {
  const { sortBy, selectedTagIds, addSelectedTag, removeSelectedTag } =
    useCommunityPage()
  const isJJ = useIsJJ()
  return (
    <div class="flex w-full flex-col gap-3">
      <Show when={!isJJ()}>
        <Tile class="flex justify-center">
          <JJStartCountdown size="sm" />
        </Tile>
      </Show>
      <div class="flex w-full items-start gap-3">
        <aside class="hidden shrink-0 lg:block" aria-label="Charities">
          <CommunityCharitiesOverview />
        </aside>
        <div
          class="flex min-w-0 flex-1 flex-col gap-3"
          style={sidebarNeighbour}
        >
          <HeadlinerTicker />
          <UpcomingStreams />
          <FundraiserToolbar title="Fundraisers" />
          <CommunityTagSearch
            selectedTagIds={selectedTagIds()}
            onAdd={addSelectedTag}
            onRemove={removeSelectedTag}
          />
          <Show when={sortBy() === 'cause'} fallback={<FundraiserGrid />}>
            <FundraiserGridByCause />
          </Show>
        </div>
      </div>
      <div class="w-full lg:hidden">
        <CommunityCharitiesOverviewMobile />
      </div>
    </div>
  )
}

// Three tiles per row once the content column is wide enough (xl, next to the charity sidebar)
const gridClass = 'grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3'

const NoTagMatches: Component = () => {
  const { clearSelectedTags } = useCommunityPage()
  return (
    <EmptyState
      title="No fundraisers match the selected tags."
      action={
        <Button size="sm" onClick={() => clearSelectedTags()}>
          Clear selected tags
        </Button>
      }
    />
  )
}

const FundraiserGrid: Component = () => {
  const { fundraisersSorted, currency } = useCommunityPage()
  return (
    <Show when={fundraisersSorted().length > 0} fallback={<NoTagMatches />}>
      <div class={gridClass}>
        <For each={fundraisersSorted()}>
          {(fundraiser) => (
            <CommunityFundraiserItem
              fundraiser={fundraiser}
              currency={currency()}
            />
          )}
        </For>
      </div>
    </Show>
  )
}

const FundraiserGridByCause: Component = () => {
  const { fundraisersByCause, currency } = useCommunityPage()
  return (
    <Show when={fundraisersByCause().length > 0} fallback={<NoTagMatches />}>
      <div class="flex w-full flex-col gap-5">
        <For each={fundraisersByCause()}>
          {(group: CauseGroup) => (
            <section class="flex flex-col gap-2" aria-label={group.title}>
              <Show
                when={group.cause}
                fallback={<DateDivider>{group.title}</DateDivider>}
              >
                {(cause) => <CommunityCauseCard cause={cause()} />}
              </Show>
              <div class={gridClass}>
                <For each={group.fundraisers}>
                  {(fundraiser) => (
                    <CommunityFundraiserItem
                      fundraiser={fundraiser}
                      currency={currency()}
                    />
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>
    </Show>
  )
}

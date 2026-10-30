import { type Component, Show } from 'solid-js'
import { createI18n, I18nProvider } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { useIsBeforeJJ, useIsJJ } from '../../../lib/utils/jjDates.ts'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import {
  type CommunityInitialData,
  CommunityPageProvider,
  useCommunityPage,
} from './CommunityPageProvider.tsx'
import { UpcomingStreams } from './UpcomingStreams.tsx'
import { CommunityTagSearch } from '../community/CommunityTagSearch.tsx'
import { CommunityCampaignGrid } from './CommunityCampaignGrid.tsx'
import { TagCatalogContext } from '../../../lib/useTagSearch.ts'
import type { CatalogTag } from '../../../lib/tagCatalog.ts'
import { JJStartCountdown } from '../../ui/Countdown'
import { Alert, EmptyState, Spinner } from '../../ui/Status'
import { Tile } from '../../ui/Tile'

export interface CommunityPageProps {
  initial?: CommunityInitialData
  tagCatalog?: CatalogTag[]
}

export const CommunityPage: Component<CommunityPageProps> = (props) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider i18n={i18n}>
        <CommunityPageProvider initial={props.initial}>
          <TagCatalogContext.Provider value={props.tagCatalog}>
            <_CommunityPage />
          </TagCatalogContext.Provider>
        </CommunityPageProvider>
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

const Body: Component = () => {
  const { selectedTagIds, addSelectedTag, removeSelectedTag } =
    useCommunityPage()
  const isJJ = useIsJJ()
  return (
    <div class="flex w-full flex-col gap-3">
      <Show when={!isJJ()}>
        <Tile class="flex justify-center">
          <JJStartCountdown size="sm" />
        </Tile>
      </Show>
      <UpcomingStreams />
      <CommunityTagSearch
        selectedTagIds={selectedTagIds()}
        onAdd={addSelectedTag}
        onRemove={removeSelectedTag}
      />
      <CommunityCampaignGrid />
    </div>
  )
}

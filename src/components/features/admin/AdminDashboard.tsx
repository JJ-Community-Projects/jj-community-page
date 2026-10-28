import { type Component, createSignal, type ParentComponent, Show } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { orpcPrivate } from '../../../lib/orpc/client'
import { Accordion } from '../../ui/Accordion'
import { Chip, DateDivider } from '../../ui/Labels'
import { AdminSection } from './common/AdminSection'
import { TagsCategoriesSection } from './tags/category/TagsCategoriesSection.tsx'
import { JJData } from './JJData.tsx'
import { AdminConfigSection } from './config/AdminConfigSection'
import { AdminKVConfigSection } from './config/AdminKVConfigSection'
import { AdminOverlayVisibilitySection } from './AdminOverlayVisibilitySection'
import { AdminTwitchSection } from './AdminTwitchSection'
import { AdminFXRateSection } from './AdminFXRateSection'
import { AdminScheduleList } from './AdminScheduleList.tsx'
import { AdminScheduleImportPanel } from './AdminScheduleImportPanel'
import { AdminSchedulerSection } from './AdminSchedulerSection'
import { AdminCampaignsList } from './AdminCampaignsList'

// Badges read the same query options as their section, so TanStack shares the cache entry
const OverlayStatus: Component = () => {
  const hidden = useQuery(() =>
    orpcPrivate.admin.getContentVisibility.queryOptions(),
  )
  return (
    <Show when={hidden.isSuccess}>
      <Show when={hidden.data} fallback={<Chip tone="accent" size="sm">Visible</Chip>}>
        <Chip tone="primary" size="sm">Hidden</Chip>
      </Show>
    </Show>
  )
}

const SchedulerStatus: Component = () => {
  const tasks = useQuery(() =>
    orpcPrivate.admin.getSchedulerTasksStatus.queryOptions({ staleTime: 5_000 }),
  )
  return (
    <Show when={tasks.data}>
      {(data) => (
        <Show
          when={!data().paused}
          fallback={<Chip tone="primary" size="sm">Paused</Chip>}
        >
          <Chip size="sm">
            {data().tasks.filter((t) => t.enabled).length} enabled
          </Chip>
        </Show>
      )}
    </Show>
  )
}

const Group: ParentComponent = (props) => (
  <DateDivider class="mt-4 first:mt-0">{props.children}</DateDivider>
)

export const AdminDashboard: Component = () => {
  // Closed by default: a section's queries run on first open. The kill switch stays open.
  const [open, setOpen] = createSignal(['overlay-visibility'])
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Accordion
        multiple
        collapsible
        value={open()}
        onChange={setOpen}
        class="flex w-full flex-col gap-2"
      >
        <Group>Site status</Group>
        <AdminSection
          value="overlay-visibility"
          title="Overlay & community content"
          summary={<OverlayStatus />}
        >
          <AdminOverlayVisibilitySection />
        </AdminSection>
        <AdminSection value="fx-rate" title="FX: GBP → EUR">
          <AdminFXRateSection />
        </AdminSection>
        <AdminSection
          value="background-tasks"
          title="Background tasks"
          summary={<SchedulerStatus />}
        >
          <AdminSchedulerSection />
        </AdminSection>

        <Group>Data & integrations</Group>
        <AdminSection value="jj-data" title="JJ API data & channels">
          <JJData />
        </AdminSection>
        <AdminSection value="twitch-tools" title="Twitch tools">
          <AdminTwitchSection />
        </AdminSection>
        <AdminSection value="campaigns" title="Campaigns">
          <AdminCampaignsList />
        </AdminSection>

        <Group>Content</Group>
        <AdminSection value="tags-categories" title="Tags & categories">
          <TagsCategoriesSection />
        </AdminSection>
        <AdminSection value="admin-configs" title="Admin configs">
          <AdminConfigSection />
        </AdminSection>
        <AdminSection value="kv-config" title="Admin KV config" forceMount>
          <AdminKVConfigSection />
        </AdminSection>

        <Group>Schedules</Group>
        <AdminSection value="all-schedules" title="All schedules" forceMount>
          <AdminScheduleList />
          <AdminScheduleImportPanel />
        </AdminSection>
      </Accordion>
    </QueryClientProvider>
  )
}

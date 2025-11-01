import { type Component } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { TagsCategoriesSection } from './tags/category/TagsCategoriesSection.tsx'
import { JJData } from './JJData.tsx'
import { AdminConfigSection } from './config/AdminConfigSection'
import { AdminKVConfigSection } from './config/AdminKVConfigSection'
import { AdminTwitchSection } from './AdminTwitchSection'
import { AdminFXRateSection } from './AdminFXRateSection'

export const AdminDashboard: Component = () => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div class="flex flex-col gap-6">
        <AdminFXRateSection />
        <AdminKVConfigSection />
        <AdminConfigSection />
        <AdminTwitchSection />
        <TagsCategoriesSection />
        <JJData />
      </div>
    </QueryClientProvider>
  )
}

import { type Component } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { TagsCategoriesSection } from './tags/category/TagsCategoriesSection.tsx'
import { JJData } from './JJData.tsx'

export const AdminDashboard: Component = () => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div class="flex flex-col">
        <TagsCategoriesSection />
        <JJData />
      </div>
    </QueryClientProvider>
  )
}

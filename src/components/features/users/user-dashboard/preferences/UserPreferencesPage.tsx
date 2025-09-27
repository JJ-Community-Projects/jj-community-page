import { type Component } from 'solid-js'
import { FaSolidChevronLeft } from 'solid-icons/fa'
import { UserSocialsSection } from './UserSocialsSection.tsx'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'
import { UserStylesSection } from './UserStylesSection.tsx'

const UserPreferencesHeader: Component = () => {
  return (
    <div class="mb-6 rounded-2xl bg-white p-6 shadow-xl">
      <div class="flex flex-col gap-4">
        <div>
          <a
            href={`/dashboard`}
            class="flex flex-row items-center gap-1 text-primary hover:underline"
          >
            <FaSolidChevronLeft />
            <p>Back to Dashboard</p>
          </a>
        </div>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Preferences</h2>
        </div>
      </div>
    </div>
  )
}

export const UserPreferencesPage: Component = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
        <UserPreferencesHeader />
        <UserStylesSection />
        <UserSocialsSection />
      </div>
    </QueryClientProvider>
  )
}

import { type Component } from 'solid-js'
import { PageHeader } from '../../../../ui/PageHeader'
import { UserSocialsSection } from './UserSocialsSection.tsx'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'
import { UserStylesSection } from './UserStylesSection.tsx'

export const UserPreferencesPage: Component = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div class="flex flex-col gap-3">
        <PageHeader
          title="Preferences"
          back={{ href: '/dashboard', label: 'Dashboard' }}
          align="start"
        />
        <UserStylesSection />
        <UserSocialsSection />
      </div>
    </QueryClientProvider>
  )
}

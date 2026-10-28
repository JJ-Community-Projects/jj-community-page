import { type Component } from 'solid-js'
import { PageHeader } from '../../../../ui/PageHeader'
import { UserProvider } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { UserBlocksSection } from './UserBlocksSection.tsx'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { UserBlockProvider } from './UserBlockProvider.tsx'

interface UserBlocksPageProps {
  user: User
}

export const UserBlocksPage: Component<UserBlocksPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <UserBlockProvider>
          <UserBlocksPageContent />
        </UserBlockProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}

const UserBlocksPageContent: Component = () => {
  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title="Block Users"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
      />
      <UserBlocksSection />
    </div>
  )
}

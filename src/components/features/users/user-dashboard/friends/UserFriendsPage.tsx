import { type Component } from 'solid-js'
import { PageHeader } from '../../../../ui/PageHeader'
import { UserProvider } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { UserFriendsSection } from './UserFriendsSection.tsx'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { UserFriendsProvider } from './UserFriendsProvider.tsx'

interface UserFriendsPageProps {
  user: User
}

export const UserFriendsPage: Component<UserFriendsPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <UserFriendsProvider>
          <UserFriendsPageContent />
        </UserFriendsProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}

const UserFriendsPageContent: Component = () => {
  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title="Your Friends"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
      />
      <UserFriendsSection />
    </div>
  )
}

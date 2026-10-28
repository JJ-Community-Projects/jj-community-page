import { type Component } from 'solid-js'
import { UserProvider } from '../../providers/UserProvider.tsx'
import type { User } from '../../../../../../lib/auth/User.ts'
import { AdminTeamDetailsProvider } from './AdminTeamDetailsProvider.tsx'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'
import { AdminTeamSection } from './AdminTeamSection.tsx'
import { PageHeader } from '../../../../../ui/PageHeader'

interface AdminTeamDetailProps {
  user: User
  teamId: number
}

export const AdminTeamDetail: Component<AdminTeamDetailProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <AdminTeamDetailsProvider teamId={props.teamId}>
          <AdminTeamDetailContent teamId={props.teamId} />
        </AdminTeamDetailsProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}

const AdminTeamDetailContent: Component<{ teamId: number }> = () => {
  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title="Team Administration"
        back={{ href: '/dashboard/teams', label: 'Teams' }}
        align="start"
      />
      <AdminTeamSection />
    </div>
  )
}

import { type Component } from 'solid-js'
import { PageHeader } from '../../../../ui/PageHeader'
import { UserProvider } from '../providers/UserProvider.tsx'
import type { User } from '../../../../../lib/auth/User.ts'
import { UserTagsSection } from './UserTagsSection.tsx'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { UserTagsProvider } from './UserTagsProvider.tsx'
import { TagCatalogContext } from '../../../../../lib/useTagSearch.ts'
import type { CatalogTag } from '../../../../../lib/tagCatalog.ts'

interface UserTagsPageProps {
  user: User
  tagCatalog?: CatalogTag[]
}

export const UserTagsPage: Component<UserTagsPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <TagCatalogContext.Provider value={props.tagCatalog}>
          <UserTagsProvider>
            <UserTagsPageContent />
          </UserTagsProvider>
        </TagCatalogContext.Provider>
      </UserProvider>
    </QueryClientProvider>
  )
}

const UserTagsPageContent: Component = () => {
  return (
    <div class="flex flex-col gap-3">
      <PageHeader
        title="Your Tags"
        back={{ href: '/dashboard', label: 'Dashboard' }}
        align="start"
      />
      <UserTagsSection />
    </div>
  )
}

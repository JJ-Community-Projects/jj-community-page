import { type Component, Show } from 'solid-js'
import { UserProvider } from './providers/UserProvider.tsx'
import type { User } from '../../../../lib/auth/User.ts'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { FaSolidArrowUpRightFromSquare } from 'solid-icons/fa'
import { Avatar } from '../../../ui/Avatar'
import { Button } from '../../../ui/Button'
import { Skeleton } from '../../../ui/Status'
import { Tile } from '../../../ui/Tile'
import { UserDashboardCards } from './UserDashboardCards.tsx'
import { UserDashboardFeedback } from './UserDashboardFeedback.tsx'

const ProfileCard: Component = () => {
  const user = useQuery(() =>
    orpcPrivate.users.getCurrentUser.queryOptions({
      staleTime: 60_000,
    }),
  )

  const imgUrl = () => {
    return user.data?.profileImage
  }

  return (
    <Show
      when={user.data}
      fallback={
        <Tile class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <Skeleton class="size-12 rounded-full" />
            <div class="flex flex-col gap-2">
              <Skeleton class="h-6 w-40" />
              <Skeleton class="h-4 w-56" />
            </div>
          </div>
          <Skeleton class="h-9 w-72" />
        </Tile>
      }
    >
      <Tile class="flex flex-col gap-4">
        <div class="flex flex-wrap items-start gap-3">
          <Avatar
            src={imgUrl()}
            alt={`${user.data?.username}'s avatar`}
            size="md"
            shape="circle"
            fallback={user.data?.username[0]}
          />
          <div class="flex min-w-0 flex-1 flex-col">
            <h1 class="truncate text-2xl font-bold tracking-tight">
              {user.data?.username}
            </h1>
            <a
              class="text-fg-muted hover:text-fg truncate text-sm underline"
              href={`/${user.data?.username}`}
            >
              jinglejam.ostof.dev/{user.data?.username}
            </a>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" size="sm">
              Logout
            </Button>
          </form>
        </div>

        <section class="flex flex-col gap-2">
          <h2 class="text-fg-muted text-sm font-semibold">Tiltify Links</h2>
          <div class="flex flex-wrap gap-2">
            <Button
              href="https://app.tiltify.com/hub"
              target="_blank"
              rel="noopener noreferrer"
              brand="tiltify"
              size="sm"
            >
              <FaSolidArrowUpRightFromSquare
                class="size-3"
                aria-hidden="true"
              />
              Tiltify Hub
            </Button>
            <Button
              href="https://app.tiltify.com/profile/setup"
              target="_blank"
              rel="noopener noreferrer"
              brand="tiltify"
              size="sm"
            >
              <FaSolidArrowUpRightFromSquare
                class="size-3"
                aria-hidden="true"
              />
              Tiltify Profile
            </Button>
            <Button
              href="https://jinglejam.tiltify.com/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="sm"
            >
              <FaSolidArrowUpRightFromSquare
                class="size-3"
                aria-hidden="true"
              />
              Create your Jingle Jam Campaign
            </Button>
          </div>
        </section>

        <UserDashboardFeedback />
      </Tile>
    </Show>
  )
}

const Root: Component = () => {
  return (
    <div class="flex flex-col gap-3">
      <ProfileCard />
      <UserDashboardCards />
    </div>
  )
}
interface AdminPageProps {
  user: User
}

export const UserAdminDashboardPage: Component<AdminPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <Root />
      </UserProvider>
    </QueryClientProvider>
  )
}

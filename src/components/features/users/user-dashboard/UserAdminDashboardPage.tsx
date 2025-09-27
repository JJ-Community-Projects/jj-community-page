import { type Component, Show } from 'solid-js'
import { UserProvider } from './providers/UserProvider.tsx'
import type { User } from '../../../../lib/auth/User.ts'
import './UserAdminDashboardPage.css'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { QueryClientProvider, useQuery, useQueryClient, } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { FaSolidArrowUpRightFromSquare, FaSolidUser } from 'solid-icons/fa'
import { UserDashboardCards } from './UserDashboardCards.tsx'

const ProfileCard: Component = () => {
  const queryClient = useQueryClient()

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
        <div class="rounded-xl border-2 border-primary-200 bg-white p-6 shadow-md md:p-8">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex flex-col">
              <div class="flex flex-col">
                <div class="flex flex-row items-center gap-3">
                  <div class="size-10 animate-pulse rounded-full border-2 border-primary-200 bg-gradient-to-r from-primary-100 to-primary-200"></div>
                  <div class="h-6 w-32 animate-pulse rounded bg-gradient-to-r from-primary-100 to-primary-200"></div>
                </div>
                <div class="mt-2 h-4 w-48 animate-pulse rounded bg-gradient-to-r from-primary-100 to-primary-200"></div>
              </div>
              <div class="mt-2 h-4 w-40 animate-pulse rounded bg-gradient-to-r from-primary-100 to-primary-200"></div>
            </div>
            <div class="flex items-center justify-center">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          </div>
          <div class="mt-6">
            <div class="mb-3 h-5 w-24 animate-pulse rounded bg-gradient-to-r from-primary-100 to-primary-200"></div>
            <div class="flex gap-3">
              <div class="h-10 w-28 animate-pulse rounded bg-gradient-to-r from-accent-100 to-accent-200"></div>
              <div class="h-10 w-32 animate-pulse rounded bg-gradient-to-r from-accent-100 to-accent-200"></div>
            </div>
          </div>
        </div>
      }
    >
      <div class="rounded-xl border-2 border-primary-200 bg-white p-6 shadow-md transition-all duration-300 md:p-8">
        <div class="mb-6 flex items-center justify-between">
          <div class={'flex flex-col'}>
            <div class={'flex flex-col'}>
              <div class={'flex flex-row items-center gap-3'}>
                <div class="relative">
                  <img
                    class={'size-10 rounded-full border-2 border-primary-200'}
                    src={imgUrl()}
                    alt={'avatar'}
                  />
                  <div class="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-primary-600">
                    <FaSolidUser class="m-0.5 h-2 w-2 text-white" />
                  </div>
                </div>
                <h2 class="font-poppins font-bold text-neutral-800 ~text-xl/2xl">
                  {user.data?.username}
                </h2>
              </div>
              <p class="font-poppins text-primary-600 ~text-sm/base">
                Your JJ Community Profile
              </p>
            </div>
            <a
              class="font-poppins font-medium text-primary transition-colors duration-200 hover:text-primary-600"
              href={`/${user.data?.username}`}
            >
              jj.ostof.dev/{user.data?.username}
            </a>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              class="transform rounded-md bg-neutral-200 px-4 py-2 font-poppins font-medium text-neutral-700 shadow-sm transition-all duration-200 hover:bg-neutral-300 hover:shadow-md focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 active:scale-95"
            >
              Logout
            </button>
          </form>
        </div>

        <div class="mt-6">
          <h3 class="mb-3 font-poppins font-bold text-neutral-800 ~text-lg/xl">
            Tiltify Links
          </h3>
          <div class="flex gap-3">
            <a
              class="flex transform items-center gap-2 rounded-md bg-tiltify px-4 py-2 font-poppins font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95"
              href="https://app.tiltify.com/hub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaSolidArrowUpRightFromSquare class="h-4 w-4" />
              Tiltify Hub
            </a>
            <a
              class="flex transform items-center gap-2 rounded-md bg-tiltify px-4 py-2 font-poppins font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-600 hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95"
              href="https://app.tiltify.com/profile/setup"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaSolidArrowUpRightFromSquare class="h-4 w-4" />
              Tiltify Profile
            </a>
          </div>
        </div>
      </div>
    </Show>
  )
}

const Root: Component = () => {
  return (
    <div class="mx-auto flex flex-col gap-6 px-4 py-8 md:gap-8 md:py-12 xl:px-20">
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

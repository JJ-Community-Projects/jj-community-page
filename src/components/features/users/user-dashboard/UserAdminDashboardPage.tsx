import {type Component, Show} from "solid-js";
import {UserProvider} from "./providers/UserProvider.tsx";
import type {User} from "../../../../lib/auth/User.ts";
import {UserSocialsSection} from "./UserSocialsSection.tsx";
import {UserStylesSection} from "./UserStylesSection.tsx";
import {DebugJSONView} from "../../../common/DebugJSONView.tsx";
import "./UserAdminDashboardPage.css";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";
import {QueryClientProvider, useQuery, useQueryClient} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";
import {
  FaSolidArrowUpRightFromSquare,
  FaSolidCalendarDays,
  FaSolidTag,
  FaSolidUser,
  FaSolidUserGroup,
  FaSolidUserSlash
} from "solid-icons/fa";


const ProfileCard: Component = () => {
  const queryClient = useQueryClient();

  const user = useQuery(() => orpcPrivate.users.getCurrentUser.queryOptions({
    staleTime: 60_000
  }))


  const imgUrl = () => {
    return user.data?.profileImage
  }

  return (
    <Show
      when={user.data}
      fallback={
        <div class="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-primary-200">
          <div class="flex justify-between items-center mb-6">
            <div class="flex flex-col">
              <div class="flex flex-col">
                <div class="flex flex-row gap-3 items-center">
                  <div
                    class="size-10 rounded-full border-2 border-primary-200 bg-gradient-to-r from-primary-100 to-primary-200 animate-pulse"></div>
                  <div class="h-6 bg-gradient-to-r from-primary-100 to-primary-200 rounded w-32 animate-pulse"></div>
                </div>
                <div class="h-4 bg-gradient-to-r from-primary-100 to-primary-200 rounded w-48 mt-2 animate-pulse"></div>
              </div>
              <div class="h-4 bg-gradient-to-r from-primary-100 to-primary-200 rounded w-40 mt-2 animate-pulse"></div>
            </div>
            <div class="flex items-center justify-center">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div class="mt-6">
            <div class="h-5 bg-gradient-to-r from-primary-100 to-primary-200 rounded w-24 mb-3 animate-pulse"></div>
            <div class="flex gap-3">
              <div class="h-10 bg-gradient-to-r from-accent-100 to-accent-200 rounded w-28 animate-pulse"></div>
              <div class="h-10 bg-gradient-to-r from-accent-100 to-accent-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      }
    >

      <div
        class="bg-white rounded-xl p-6 md:p-8 shadow-md border-2 border-primary-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300">
        <div class="flex justify-between items-center mb-6">
          <div class={'flex flex-col'}>
            <div class={'flex flex-col'}>
              <div class={'flex flex-row gap-3 items-center'}>
                <div class="relative">
                  <img class={'size-10 rounded-full border-2 border-primary-200'} src={imgUrl()} alt={'avatar'}/>
                  <div
                    class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full border-2 border-white">
                    <FaSolidUser class="w-2 h-2 text-white m-0.5"/>
                  </div>
                </div>
                <h2 class="~text-xl/2xl font-poppins font-bold text-neutral-800">{user.data?.username}</h2>
              </div>
              <p class="~text-sm/base font-poppins text-primary-600">Your JJ Community Profile</p>
            </div>
            <a
              class="text-primary hover:text-primary-600 transition-colors duration-200 font-medium font-poppins"
              href={`/${user.data?.username}`}
            >
              jj.ostof.dev/{user.data?.username}
            </a>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              class="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-md font-medium font-poppins hover:bg-neutral-300 shadow-sm hover:shadow-md focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-all duration-200 transform active:scale-95"
            >
              Logout
            </button>
          </form>
        </div>

        <div class="mt-6">
          <h3 class="~text-lg/xl font-poppins font-bold mb-3 text-neutral-800">Tiltify Links</h3>
          <div class="flex gap-3">
            <a
              class="px-4 py-2 bg-tiltify text-white rounded-md font-medium font-poppins hover:bg-accent-600 shadow-sm hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 transform active:scale-95 flex items-center gap-2"
              href="https://app.tiltify.com/hub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaSolidArrowUpRightFromSquare class="w-4 h-4"/>
              Tiltify Hub
            </a>
            <a
              class="px-4 py-2 bg-tiltify text-white rounded-md font-medium font-poppins hover:bg-accent-600 shadow-sm hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 transform active:scale-95 flex items-center gap-2"
              href="https://app.tiltify.com/profile/setup"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaSolidArrowUpRightFromSquare class="w-4 h-4"/>
              Tiltify Profile
            </a>
          </div>
        </div>
      </div>
    </Show>
  )
}

const ScheduleCard: Component = () => {
  return (
    <a
      href={`/dashboard/schedules`}
      class="bg-white group relative overflow-hidden rounded-xl px-4 py-3 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out transform focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98] border-2 border-accent-100 hover:border-accent-200"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2">
          <FaSolidCalendarDays class="w-5 h-5 text-accent-600"/>
          <h3 class="~text-lg/xl font-poppins font-bold text-neutral-800">Schedules</h3>
        </div>
        <p class="~text-sm/base font-poppins text-neutral-600 mb-4">Manage your streaming schedules for JingleJam</p>
        <div class="mt-auto">
          <span class="text-accent-600 font-medium font-poppins">View Schedules →</span>
        </div>
      </div>
    </a>
  )
}

const TeamCard: Component = () => {

  const inviteCountData = useQuery(() => orpcPrivate.teamsSSE.getUserTeamInvitesCountSSE.experimental_liveOptions({
    staleTime: 30 * 1000,
  }))

  const counterText = () => {
    const c = inviteCountData.data?.count ?? 0
    if (c > 1) {
      return `(${c} invites)`
    }
    return `(${c} invite)`
  }

  const hasInvites = () => {
    return inviteCountData.data?.count ?? 0 > 0
  }


  return (
    <a
      href={`/dashboard/teams`}
      class="bg-white group relative overflow-hidden rounded-xl px-4 py-3 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out transform focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98] border-2 border-accent-100 hover:border-accent-200"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2">
          <FaSolidUserGroup class="w-5 h-5 text-accent-600"/>
          <h3 class="~text-lg/xl font-poppins font-bold text-neutral-800">Teams</h3>
        </div>
        <p class="~text-sm/base font-poppins text-neutral-600 mb-4">Manage your teams and team invitations</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-accent-600 font-medium font-poppins">View Teams →</span>
          <Show when={hasInvites()}>
            <span class="bg-primary text-white text-sm px-2 py-1 rounded-full font-medium">
              {counterText()}
            </span>
          </Show>
        </div>
      </div>
    </a>
  )
}

const TagsCard: Component = () => {
  return (
    <a
      href={`/dashboard/tags`}
      class="bg-white group relative overflow-hidden rounded-xl px-4 py-3 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out transform focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98] border-2 border-accent-100 hover:border-accent-200"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2">
          <FaSolidTag class="w-5 h-5 text-accent-600"/>
          <h3 class="~text-lg/xl font-poppins font-bold text-neutral-800">Tags</h3>
        </div>
        <p class="~text-sm/base font-poppins text-neutral-600 mb-4">Manage your profile tags and interests</p>
        <div class="mt-auto">
          <span class="text-accent-600 font-medium font-poppins">Manage Tags →</span>
        </div>
      </div>
    </a>
  )
}

const FriendsCard: Component = () => {
  const friendsData = useQuery(() => orpcPrivate.friendsSSE.getUserFriendRequestsCountSSE.experimental_liveOptions({
    staleTime: 30 * 1000,
  }))

  const counterText = () => {
    const c = friendsData.data?.count ?? 0
    if (c > 1) {
      return `(${c} Requests)`
    }
    return `(${c} Request)`
  }

  const hasRequests = () => {
    return friendsData.data?.count ?? 0 > 0
  }

  return (
    <a
      href={`/dashboard/friends`}
      class="bg-white group relative overflow-hidden rounded-xl px-4 py-3 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out transform focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98] border-2 border-accent-100 hover:border-accent-200"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2">
          <FaSolidUser class="w-5 h-5 text-accent-600"/>
          <h3 class="~text-lg/xl font-poppins font-bold text-neutral-800">Friends</h3>
        </div>
        <p class="~text-sm/base font-poppins text-neutral-600 mb-4">Manage your friends and friend requests</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-accent-600 font-medium font-poppins">Manage Friends →</span>
          <Show when={hasRequests()}>
            <span class="bg-primary text-white text-sm px-2 py-1 rounded-full font-medium">
              {counterText()}
            </span>
          </Show>
        </div>
      </div>
    </a>
  )
}

const BlockedCard: Component = () => {
  const blockedUsersData = useQuery(() => orpcPrivate.blocking.listBlockedUsers.queryOptions({
    staleTime: 30 * 1000,
  }))

  const counterText = () => {
    const c = blockedUsersData.data?.length ?? 0
    if (c === 1) {
      return `(${c} user)`
    }
    return `(${c} users)`
  }

  const hasBlockedUsers = () => {
    return blockedUsersData.data?.length ?? 0 > 0
  }

  return (
    <a
      href={`/dashboard/block`}
      class="bg-white rounded-xl p-4 shadow-md border-2 border-danger-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-danger-300 focus:ring-2 focus:ring-danger focus:ring-offset-2"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2">
          <FaSolidUserSlash class="w-5 h-5 text-danger-600"/>
          <h3 class="~text-lg/xl font-poppins font-bold mb-2 text-neutral-800">Blocked Users</h3>
        </div>
        <p class="~text-sm/base font-poppins text-neutral-600 mb-4">Manage your blocked users list</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-danger-600 font-medium font-poppins">Manage Blocks →</span>
          <Show when={hasBlockedUsers()}>
            <span class="bg-danger text-white text-sm px-2 py-1 rounded-full font-medium">
              {counterText()}
            </span>
          </Show>
        </div>
      </div>
    </a>
  )
}

const Root: Component = () => {

  const user = useQuery(() => orpcPrivate.users.getCurrentUser.queryOptions({
    staleTime: 60_000
  }))

  return (
    <div class="max-w-7xl mx-auto px-4 xl:px-20 py-8 md:py-12 flex flex-col gap-6 md:gap-8">
      {/* Profile Card with Tiltify Links */}
      <ProfileCard/>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Schedules Card */}
        <ScheduleCard/>

        {/* Teams Card */}
        <TeamCard/>

        {/* Tags Card */}
        <TagsCard/>

        {/* Friends Card */}
        <FriendsCard/>

        {/* Blocked Users Card */}
        <BlockedCard/>
      </div>

      {/* User Socials Section */}
      <UserSocialsSection/>

      {/* User Styles Section */}
      <UserStylesSection/>

      <Show when={user.data}>
        <DebugJSONView data={user.data} title={'User Data'}/>
      </Show>
    </div>
  );
}

interface AdminPageProps {
  user: User
}

export const UserAdminDashboardPage: Component<AdminPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <Root/>
      </UserProvider>
    </QueryClientProvider>
  );
}

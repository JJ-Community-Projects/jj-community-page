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


const ProfileCard: Component = () => {
  const queryClient = useQueryClient();

  const user = useQuery(() => orpcPrivate.users.getCurrentUser.queryOptions({
    staleTime: 60_000
  }))


  const imgUrl = () => {
    return user.data?.profileImage
  }

  return (
    <Show when={user.data}>

      <div class="bg-white rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <div class={'flex flex-col'}>
            <div class={'flex flex-col'}>
              <div class={'flex flex-row gap-2 items-center'}>
                <img class={'size-8 rounded-full'} src={imgUrl()} alt={'avatar'}/>
                <h2 class="text-xl font-bold">{user.data?.username}</h2>
              </div>
              <h2 class="text-md"> Your JJ Community Profile</h2>
            </div>
            <a class="text-primary" href={`/${user.data?.username}`}>jj.ostof.dev/{user.data?.username}</a>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-all"
            >
              Logout
            </button>
          </form>
        </div>

        <div class="mt-4">
          <h3 class="text-lg font-bold mb-2">Tiltify Links</h3>
          <div class="flex gap-4">
            <a
              class="bg-tiltify text-white px-4 py-2 rounded-lg hover:bg-tiltify/80 transition-all"
              href="https://app.tiltify.com/hub"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tiltify Hub
            </a>
            <a
              class="bg-tiltify text-white px-4 py-2 rounded-lg hover:bg-tiltify/80 transition-all"
              href="https://app.tiltify.com/profile/setup"
              target="_blank"
              rel="noopener noreferrer"
            >
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
      class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
    >
      <div class="flex flex-col h-full">
        <h3 class="text-xl font-bold mb-2">Schedules</h3>
        <p class="text-gray-600 mb-4">Manage your streaming schedules for JingleJam</p>
        <div class="mt-auto">
          <span class="text-accent font-medium">View Schedules →</span>
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
      class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
    >
      <div class="flex flex-col h-full">
        <h3 class="text-xl font-bold mb-2">Teams</h3>
        <p class="text-gray-600 mb-4">Manage your teams and team invitations</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-accent font-medium">View Teams →</span>
          <Show when={hasInvites()}>
            <span class="bg-primary text-white text-sm px-2 py-1 rounded-full">
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
      class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
    >
      <div class="flex flex-col h-full">
        <h3 class="text-xl font-bold mb-2">Tags</h3>
        <p class="text-gray-600 mb-4">Manage your profile tags and interests</p>
        <div class="mt-auto">
          <span class="text-accent font-medium">Manage Tags →</span>
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
      class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
    >
      <div class="flex flex-col h-full">
        <h3 class="text-xl font-bold mb-2">Friends</h3>
        <p class="text-gray-600 mb-4">Manage your friends and friend requests</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-accent font-medium">Manage Friends →</span>
          <Show when={hasRequests()}>
            <span class="bg-primary text-white text-sm px-2 py-1 rounded-full">
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
      class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
    >
      <div class="flex flex-col h-full">
        <h3 class="text-xl font-bold mb-2">Blocked Users</h3>
        <p class="text-gray-600 mb-4">Manage your blocked users list</p>
        <div class="mt-auto flex justify-between items-center">
          <span class="text-accent font-medium">Manage Blocks →</span>
          <Show when={hasBlockedUsers()}>
            <span class="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
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
    <div class="w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Profile Card with Tiltify Links */}
      <ProfileCard/>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

import { type Component, Show } from 'solid-js'
import './UserAdminDashboardPage.css'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { useQuery } from '@tanstack/solid-query'
import {
  FaRegularPenToSquare,
  FaSolidCalendarDays,
  FaSolidTag,
  FaSolidUser,
  FaSolidUserGroup,
  FaSolidUserSlash,
} from 'solid-icons/fa'
import { useNow } from '../../../../lib/utils/useNow.ts'
import { useSchedule } from './teams/useSchedule.ts'

const ScheduleCard: Component = () => {
  const now = useNow()
  // Query for user schedules
  const { showWarning } = useSchedule()

  return (
    <a
      href={`/dashboard/schedules`}
      class="group relative transform overflow-hidden rounded-xl border-2 border-accent-100 bg-white px-4 py-3 shadow-md transition-all duration-300 ease-out hover:border-accent-200 hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidCalendarDays class="h-5 w-5 text-accent-600" />
          <h3 class="font-poppins font-bold text-neutral-800 ~text-lg/xl">
            Schedules
          </h3>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your streaming schedules for JingleJam
        </p>
        <Show when={showWarning()}>
          <div class="mb-2 flex flex-col items-start justify-start gap-2">
            <span class="rounded-full bg-warning px-2 py-1 text-sm font-medium text-white">
              Warning
            </span>
            <p class="font-poppins text-warning-600 ~text-sm/base">
              Please check if your schedule is setup correctly. If you have any issues, please contact @Ostof on Discord.
            </p>
          </div>
        </Show>
        <div class="mt-auto">
          <span class="font-poppins font-medium text-accent-600">
            View Schedules →
          </span>
        </div>
      </div>
    </a>
  )
}

const TeamCard: Component = () => {
  const inviteCountData = useQuery(() =>
    orpcPrivate.teamsWS.getUserTeamInvitesWS.experimental_liveOptions({
      staleTime: 30 * 1000,
    }),
  )

  const counterText = () => {
    const c = inviteCountData.data?.invites?.length ?? 0
    if (c > 1) {
      return `(${c} invites)`
    }
    return `${c}`
  }

  const hasInvites = () => {
    return inviteCountData.data?.invites?.length ?? 0 > 0
  }

  return (
    <a
      href={`/dashboard/teams`}
      class="group relative transform overflow-hidden rounded-xl border-2 border-accent-100 bg-white px-4 py-3 shadow-md transition-all duration-300 ease-out hover:border-accent-200 hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <FaSolidUserGroup class="h-5 w-5 text-accent-600" />
            <h3 class="font-poppins font-bold text-neutral-800 ~text-lg/xl">
              Teams
            </h3>
          </div>
          <Show when={hasInvites()}>
            <span class="relative flex size-5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {counterText()}
              </span>
            </span>
          </Show>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your teams and team invitations
        </p>
        <div class="mt-auto flex items-center justify-between">
          <span class="font-poppins font-medium text-accent-600">
            View Teams →
          </span>
        </div>
      </div>
    </a>
  )
}

const TagsCard: Component = () => {
  return (
    <a
      href={`/dashboard/tags`}
      class="group relative transform overflow-hidden rounded-xl border-2 border-accent-100 bg-white px-4 py-3 shadow-md transition-all duration-300 ease-out hover:border-accent-200 hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidTag class="h-5 w-5 text-accent-600" />
          <h3 class="font-poppins font-bold text-neutral-800 ~text-lg/xl">
            Tags
          </h3>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your profile tags and interests
        </p>
        <div class="mt-auto">
          <span class="font-poppins font-medium text-accent-600">
            Manage Tags →
          </span>
        </div>
      </div>
    </a>
  )
}

const PrefsCard: Component = () => {
  return (
    <a
      href={`/dashboard/preferences`}
      class="group relative transform overflow-hidden rounded-xl border-2 border-accent-100 bg-white px-4 py-3 shadow-md transition-all duration-300 ease-out hover:border-accent-200 hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaRegularPenToSquare class="h-5 w-5 text-accent-600" />
          <h3 class="font-poppins font-bold text-neutral-800 ~text-lg/xl">
            Preferences
          </h3>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your Socials and Style
        </p>
        <div class="mt-auto">
          <span class="font-poppins font-medium text-accent-600">
            Manage Preferences →
          </span>
        </div>
      </div>
    </a>
  )
}

const FriendsCard: Component = () => {
  const friendsData = useQuery(() =>
    orpcPrivate.friendsWS.getUserFriendRequestsWS.experimental_liveOptions({
      staleTime: 30 * 1000,
    }),
  )

  const counterText = () => {
    const c = friendsData.data?.users?.length ?? 0
    if (c > 1) {
      return `(${c} Requests)`
    }
    return `${c}`
  }

  const hasRequests = () => {
    return friendsData.data?.users?.length ?? 0 > 0
  }

  return (
    <a
      href={`/dashboard/friends`}
      class="group relative transform overflow-hidden rounded-xl border-2 border-accent-100 bg-white px-4 py-3 shadow-md transition-all duration-300 ease-out hover:border-accent-200 hover:shadow-lg focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <FaSolidUser class="h-5 w-5 text-accent-600" />
            <h3 class="font-poppins font-bold text-neutral-800 ~text-lg/xl">
              Friends
            </h3>
          </div>
          <Show when={hasRequests()}>
            <span class="relative flex size-5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {counterText()}
              </span>
            </span>
          </Show>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your friends and friend requests
        </p>
        <div class="mt-auto flex items-center justify-between">
          <span class="font-poppins font-medium text-accent-600">
            Manage Friends →
          </span>
        </div>
      </div>
    </a>
  )
}

const BlockedCard: Component = () => {
  const blockedUsersData = useQuery(() =>
    orpcPrivate.blocking.listBlockedUsers.queryOptions({
      staleTime: 30 * 1000,
    }),
  )

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
      class="rounded-xl border-2 border-danger-200 bg-white p-4 shadow-md transition-all duration-300 focus:ring-2 focus:ring-danger focus:ring-offset-2"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidUserSlash class="h-5 w-5 text-danger-600" />
          <h3 class="mb-2 font-poppins font-bold text-neutral-800 ~text-lg/xl">
            Blocked Users
          </h3>
        </div>
        <p class="mb-4 font-poppins text-neutral-600 ~text-sm/base">
          Manage your blocked users list
        </p>
        <div class="mt-auto flex items-center justify-between">
          <span class="font-poppins font-medium text-danger-600">
            Manage Blocks →
          </span>
          <Show when={hasBlockedUsers()}>
            <span class="rounded-full bg-danger px-2 py-1 text-sm font-medium text-white">
              {counterText()}
            </span>
          </Show>
        </div>
      </div>
    </a>
  )
}

export const UserDashboardCards: Component = () => {
  return (
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      <PrefsCard />

      <TagsCard />

      <ScheduleCard />

      <TeamCard />

      <FriendsCard />

      <BlockedCard />
    </div>
  )
}

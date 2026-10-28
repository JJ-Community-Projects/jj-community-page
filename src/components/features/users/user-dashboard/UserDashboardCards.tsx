import { type Component, Show } from 'solid-js'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { feedRenewal } from '../../../../lib/orpc/tokenRenewal.ts'
import { useQuery, useQueryClient } from '@tanstack/solid-query'
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
  const { showWarning } = useSchedule()

  return (
    <a
      href={`/dashboard/schedules`}
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover group focus:ring-accent relative overflow-hidden bg-linear-to-b px-4 py-3 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidCalendarDays class="text-accent-600 h-5 w-5" />
          <h2 class="text-fg text-base font-semibold">Schedules</h2>
        </div>
        <p class="text-fg-muted mb-4 text-sm">
          Manage your streaming schedules for JingleJam
        </p>
        <Show when={showWarning()}>
          <div class="mb-2 flex flex-col items-start justify-start gap-2">
            <span class="bg-warning rounded-full px-2 py-1 text-sm font-medium text-white">
              Warning
            </span>
            <p class="text-warning-600 text-sm">
              Please check if your schedule is setup correctly. If you have any
              issues, please contact @Ostof on Discord.
            </p>
          </div>
        </Show>
        <div class="mt-auto">
          <span class="text-accent-600 font-medium">View Schedules →</span>
        </div>
      </div>
    </a>
  )
}

const TeamCard: Component = () => {
  const queryClient = useQueryClient()
  const invites = orpcPrivate.teamsWS.getUserTeamInvitesWS
  const inviteCountData = useQuery(() =>
    invites.experimental_liveOptions({
      context: feedRenewal(queryClient, invites),
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
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover group focus:ring-accent relative overflow-hidden bg-linear-to-b px-4 py-3 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <FaSolidUserGroup class="text-accent-600 h-5 w-5" />
            <h2 class="text-fg text-base font-semibold">Teams</h2>
          </div>
          <Show when={hasInvites()}>
            <span class="relative flex size-5">
              <span class="bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span class="bg-primary relative inline-flex size-5 items-center justify-center rounded-full text-xs text-white">
                {counterText()}
              </span>
            </span>
          </Show>
        </div>
        <p class="text-fg-muted mb-4 text-sm">
          Manage your teams and team invitations
        </p>
        <div class="mt-auto flex items-center justify-between">
          <span class="text-accent-600 font-medium">View Teams →</span>
        </div>
      </div>
    </a>
  )
}

const TagsCard: Component = () => {
  return (
    <a
      href={`/dashboard/tags`}
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover group focus:ring-accent relative overflow-hidden bg-linear-to-b px-4 py-3 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidTag class="text-accent-600 h-5 w-5" />
          <h2 class="text-fg text-base font-semibold">Tags</h2>
        </div>
        <p class="text-fg-muted mb-4 text-sm">
          Manage your profile tags and interests
        </p>
        <div class="mt-auto">
          <span class="text-accent-600 font-medium">Manage Tags →</span>
        </div>
      </div>
    </a>
  )
}

const PrefsCard: Component = () => {
  return (
    <a
      href={`/dashboard/preferences`}
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover group focus:ring-accent relative overflow-hidden bg-linear-to-b px-4 py-3 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaRegularPenToSquare class="text-accent-600 h-5 w-5" />
          <h2 class="text-fg text-base font-semibold">Preferences</h2>
        </div>
        <p class="text-fg-muted mb-4 text-sm">Manage your Socials and Style</p>
        <div class="mt-auto">
          <span class="text-accent-600 font-medium">Manage Preferences →</span>
        </div>
      </div>
    </a>
  )
}

const FriendsCard: Component = () => {
  const queryClient = useQueryClient()
  const requests = orpcPrivate.friendsWS.getUserFriendRequestsWS
  const friendsData = useQuery(() =>
    requests.experimental_liveOptions({
      context: feedRenewal(queryClient, requests),
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
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover group focus:ring-accent relative overflow-hidden bg-linear-to-b px-4 py-3 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2 active:scale-[0.98]"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <FaSolidUser class="text-accent-600 h-5 w-5" />
            <h2 class="text-fg text-base font-semibold">Friends</h2>
          </div>
          <Show when={hasRequests()}>
            <span class="relative flex size-5">
              <span class="bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span class="bg-primary relative inline-flex size-5 items-center justify-center rounded-full text-xs text-white">
                {counterText()}
              </span>
            </span>
          </Show>
        </div>
        <p class="text-fg-muted mb-4 text-sm">
          Manage your friends and friend requests
        </p>
        <div class="mt-auto flex items-center justify-between">
          <span class="text-accent-600 font-medium">Manage Friends →</span>
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
      class="rounded-tile from-surface to-surface-2 text-fg shadow-tile ring-line hover:shadow-tile-hover focus:ring-danger bg-linear-to-b p-4 ring-1 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-offset-2"
    >
      <div class="flex h-full flex-col">
        <div class="mb-2 flex items-center gap-2">
          <FaSolidUserSlash class="text-danger-600 h-5 w-5" />
          <h2 class="text-fg mb-2 text-base font-semibold">Blocked Users</h2>
        </div>
        <p class="text-fg-muted mb-4 text-sm">Manage your blocked users list</p>
        <div class="mt-auto flex items-center justify-between">
          <span class="text-danger-600 font-medium">Manage Blocks →</span>
          <Show when={hasBlockedUsers()}>
            <span class="bg-danger rounded-full px-2 py-1 text-sm font-medium text-white">
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
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PrefsCard />

      <TagsCard />

      <ScheduleCard />

      <TeamCard />

      <FriendsCard />

      <BlockedCard />
    </div>
  )
}

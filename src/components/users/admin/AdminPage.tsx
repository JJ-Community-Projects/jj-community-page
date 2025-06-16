import {type Component, Show} from "solid-js";
import {UserProvider, useUser} from "./providers/UserProvider.tsx";
import type {User} from "../../../lib/auth/User.ts";
import {UserDODebug} from "../../../pages/[username]/admin/UserDODebug.tsx";
import {UserTagsSection} from "./UserTagsSection.tsx";
import {UserSocialsSection} from "./UserSocialsSection.tsx";

interface AdminPageProps {
  user: User
}

export const AdminPage: Component<AdminPageProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <Root/>
    </UserProvider>
  );
}

export const Root: Component = () => {
  const {user, local} = useUser();


  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Profile Card with Tiltify Links */}
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <div class={'flex flex-col'}>
            <h2 class="text-xl font-bold">Your JJ Community Profile</h2>
            <h2 class="">{user.tiltifyName}</h2>
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

      {/* Schedules Card */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href={`/${user.tiltifyName}/admin/schedules`}
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

        {/* Teams Card */}
        <a
          href={`/${user.tiltifyName}/admin/teams`}
          class="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
        >
          <div class="flex flex-col h-full">
            <h3 class="text-xl font-bold mb-2">Teams</h3>
            <p class="text-gray-600 mb-4">Manage your teams and team invitations</p>
            <div class="mt-auto flex justify-between items-center">
              <span class="text-accent font-medium">View Teams →</span>
              <Show when={local.invites.length > 0}>
                <span class="bg-primary text-white text-sm px-2 py-1 rounded-full">
                  {local.invites.length} invite{local.invites.length !== 1 ? 's' : ''}
                </span>
              </Show>
            </div>
          </div>
        </a>
      </div>

      {/* User Tags and Socials Sections */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UserTagsSection />
        <UserSocialsSection />
      </div>
    </div>
  );
}

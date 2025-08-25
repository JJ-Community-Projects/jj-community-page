import {type Component} from "solid-js";
import {UserProvider} from "../../providers/UserProvider.tsx";
import type {User} from "../../../../../../lib/auth/User.ts";
import {FaSolidChevronLeft} from "solid-icons/fa";
import {AdminTeamSettingsSection} from "./AdminTeamSettingsSection.tsx";
import {AdminTeamMembersSection} from "./AdminTeamMembersSection.tsx";
import {AdminTeamInvitesSection} from "./AdminTeamInvitesSection.tsx";
import {AdminTeamDetailsProvider} from "./AdminTeamDetailsProvider.tsx";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/solid-query";
import {AdminTeamSection} from "./AdminTeamSection.tsx";

interface AdminTeamDetailProps {
  user: User;
  teamId: number;
}

export const AdminTeamDetail: Component<AdminTeamDetailProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <AdminTeamDetailsProvider teamId={props.teamId}>
          <AdminTeamDetailContent teamId={props.teamId}/>
        </AdminTeamDetailsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

const AdminTeamDetailContent: Component<{ teamId: number }> = (props) => {
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <AdminTeamDetailHeader/>
      <div class="bg-white rounded-2xl shadow-xl">
        <AdminTeamSection/>
      </div>
    </div>
  );
};

const AdminTeamDetailHeader: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/dashboard/teams`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Teams</p>
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Team Administration</h2>
        </div>
      </div>
    </div>
  );
};

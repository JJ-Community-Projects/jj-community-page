import {type Component} from "solid-js";
import {UserProvider} from "../../providers/UserProvider.tsx";
import type {User} from "../../../../../../lib/auth/User.ts";
import {AdminTeamDetailHeader} from "./AdminTeamDetailHeader.tsx";
import {AdminTeamSettingsSection} from "./AdminTeamSettingsSection.tsx";
import {AdminTeamMembersSection} from "./AdminTeamMembersSection.tsx";
import {AdminTeamInvitesSection} from "./AdminTeamInvitesSection.tsx";
import {AdminTeamDetailsProvider} from "./AdminTeamDetailsProvider.tsx";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/solid-query";

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

// bg-gradient-to-br from-primary-shade via-primary to-primary-shade
const AdminTeamDetailContent: Component<{ teamId: number }> = (props) => {
  return (
    <div class="max-full px-4 py-8 flex flex-col gap-4">
      <AdminTeamDetailHeader/>
      <AdminTeamSettingsSection/>
      <AdminTeamMembersSection/>
      <AdminTeamInvitesSection/>
    </div>
  );
};

import {type Component, createEffect, createSignal, For, Show} from "solid-js";
import {UserProvider, useUser} from "../../providers/UserProvider.tsx";
import {TeamDetailsProvider, useTeamDetail} from "../../providers/TeamDetailsProvider.tsx";
import type {User} from "../../../../lib/auth/User.ts";
import {TextField} from "@kobalte/core/text-field";
import {debounce} from "@solid-primitives/scheduled";
import {actions} from "astro:actions";
import {createStore} from "solid-js/store";
import {AdminTeamDetailHeader} from "./AdminTeamDetailHeader.tsx";
import {ConfirmationDialog} from "../../../common/ConfirmationDialog.tsx";
import {createModalSignal} from "../../../../lib/createModalSignal.ts";
import {FaRegularCircle, FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";
import { AdminTeamSettingsSection } from "./AdminTeamSettingsSection.tsx";
import { AdminTeamMembersSection } from "./AdminTeamMembersSection.tsx";
import {AdminTeamInvitesSection} from "./AdminTeamInvitesSection.tsx";

interface AdminTeamDetailProps {
  user: User;
  teamId: number;
}

export const AdminTeamDetail: Component<AdminTeamDetailProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <TeamDetailsProvider teamId={props.teamId} user={props.user}>
        <AdminTeamDetailContent teamId={props.teamId}/>
      </TeamDetailsProvider>
    </UserProvider>
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

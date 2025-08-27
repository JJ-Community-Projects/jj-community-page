import {type Component} from "solid-js";
import {AdminTeamSettingsSection} from "./AdminTeamSettingsSection.tsx";
import {AdminTeamMembersSection} from "./AdminTeamMembersSection.tsx";
import {AdminTeamInvitesSection} from "./AdminTeamInvitesSection.tsx";
import {AdminTeamHeader} from "./AdminTeamHeader.tsx";

/**
 * AdminTeamSection Component
 *
 * Main section for team administration functionality.
 * Enhanced with modern design, glass-morphism effects, and improved user experience.
 *
 * Features:
 * - Team header with information and delete functionality (AdminTeamHeader)
 * - Team settings management with real-time validation
 * - Team member management with invite/remove functionality
 * - Team invitations management
 * - Visual feedback for all operations
 * - Responsive design with fluid typography
 * - Comprehensive accessibility support
 *
 * Uses AdminTeamDetailsProvider context for data management to avoid prop drilling.
 * All child components access data directly from the provider context.
 */
export const AdminTeamSection: Component = () => {

  return (
    <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div class="~p-4/8 space-y-6">

        {/* Team Information Header */}
        <AdminTeamHeader/>

        {/* Team Settings Section */}
        <AdminTeamSettingsSection/>

        {/* Team Members Section */}
        <AdminTeamMembersSection/>

        {/* Team Invites Section */}
        <AdminTeamInvitesSection/>

      </div>
    </div>
  );
};

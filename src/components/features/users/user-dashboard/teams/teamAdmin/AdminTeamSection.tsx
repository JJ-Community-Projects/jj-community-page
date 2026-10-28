import { type Component } from 'solid-js'
import { AdminTeamSettingsSection } from './AdminTeamSettingsSection.tsx'
import { AdminTeamMembersSection } from './AdminTeamMembersSection.tsx'
import { AdminTeamInvitesSection } from './AdminTeamInvitesSection.tsx'
import { AdminTeamHeader } from './AdminTeamHeader.tsx'
import { Tile } from '../../../../../ui/Tile'

/**
 * Team administration: info + delete, settings, members, invites. Each part is its own tile; the
 * browser tests find a part by its h4 and scope to the heading's grandparent, the tile.
 */
export const AdminTeamSection: Component = () => (
  <div class="flex flex-col gap-3">
    <AdminTeamHeader />
    <div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      <Tile>
        <AdminTeamSettingsSection />
      </Tile>
      <div class="flex flex-col gap-3">
        <Tile>
          <AdminTeamMembersSection />
        </Tile>
        <AdminTeamInvitesSection />
      </div>
    </div>
  </div>
)

/**
 * UI representation of a team
 */
export interface TeamUI {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  visible: boolean;
  owner: TeamMemberUI;
  members: TeamMemberUI[];
  invites: TeamInviteUI[];
  canEdit: boolean;
  canInvite: boolean;
  isMember: boolean;
  isOwner: boolean;
  isInvited: boolean;
}

/**
 * UI representation of a team member
 */
export interface TeamMemberUI {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
  isOwner: boolean;
  isLive: boolean;
  primaryLiveStream: string;
}

/**
 * UI representation of a team invite
 */
export interface TeamInviteUI {
  userId: number;
  name: string;
  avatar: string | null;
  invitedAt: string;
}

/**
 * UI representation of a team list item
 */
export interface TeamListItemUI {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  visible: boolean;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  memberCount: number;
  canEdit: boolean;
  isMember: boolean;
  isOwner: boolean;
  isInvited: boolean;
}

/**
 * UI representation of a team summary
 */
export interface TeamSummaryUI {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  visible: boolean;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  memberCount: number;
  liveMembers: TeamMemberUI[];
  canEdit: boolean;
  isMember: boolean;
  isOwner: boolean;
  isInvited: boolean;
}

/**
 * UI representation of a team invitation
 */
export interface TeamInvitationUI {
  teamId: number;
  teamName: string;
  teamSlug: string;
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  memberCount: number;
  invitedAt: string;
}

/**
 * UI representation of a team membership
 */
export interface TeamMembershipUI {
  teamId: number;
  teamName: string;
  teamSlug: string;
  isOwner: boolean;
  memberCount: number;
  liveMembers: TeamMemberUI[];
}

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { teamsTable, teamMembersTable, teamInvitesTable } from "../schema/jj-schema.ts";
import type { User } from "./user.ts";

/**
 * Team entity type from database schema
 */
export type Team = InferSelectModel<typeof teamsTable>;

/**
 * Team insert type for creating new teams
 */
export type TeamInsert = InferInsertModel<typeof teamsTable>;

/**
 * Team member entity type from database schema
 */
export type TeamMember = InferSelectModel<typeof teamMembersTable>;

/**
 * Team member insert type for creating new team members
 */
export type TeamMemberInsert = InferInsertModel<typeof teamMembersTable>;

/**
 * Team invite entity type from database schema
 */
export type TeamInvite = InferSelectModel<typeof teamInvitesTable>;

/**
 * Team invite insert type for creating new team invites
 */
export type TeamInviteInsert = InferInsertModel<typeof teamInvitesTable>;

/**
 * Team with owner relationship
 */
export interface TeamWithOwner extends Team {
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

/**
 * Team with members relationship
 */
export interface TeamWithMembers extends Team {
  members: User[];
}

/**
 * Team with invites relationship
 */
export interface TeamWithInvites extends Team {
  invites: {
    userId: number;
    user: {
      id: number;
      name: string;
      avatar: string | null;
    };
  }[];
}

/**
 * Complete team with all relationships
 */
export interface TeamComplete extends Team {
  owner: {
    id: number;
    name: string;
    avatar: string | null;
  };
  members: User[];
  invites: {
    userId: number;
    user: {
      id: number;
      name: string;
      avatar: string | null;
    };
  }[];
}

/**
 * Input type for creating a new team
 */
export interface TeamInput {
  ownerId: number;
  name: string;
  description?: string;
  slug: string;
  visible?: boolean;
}

/**
 * Input type for updating a team
 */
export interface TeamUpdateInput {
  name?: string;
  description?: string;
  slug?: string;
  visible?: boolean;
}

/**
 * Input type for adding a member to a team
 */
export interface TeamMemberInput {
  teamId: number;
  userId: number;
}

/**
 * Input type for inviting a user to a team
 */
export interface TeamInviteInput {
  teamId: number;
  invitedUserId: number;
}

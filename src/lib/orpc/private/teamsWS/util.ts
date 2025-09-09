import type {JJDrizzleDatabase} from "../../../db/db.ts";
import {userDisplayView} from "../../../db/schema/views-schema.ts";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../../../db/schema/jj-schema.ts";
import {and, eq, not} from "drizzle-orm";
import type {UserDisplay} from "../schemas/users.ts";
import type {Team} from "../../public/schemas/teams.ts";

export async function getTeamInvites(db: JJDrizzleDatabase, teamId: number): Promise<UserDisplay[]> {
  return db.select({
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    role: userDisplayView.role,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(teamInvitesTable)
    .innerJoin(userDisplayView, eq(teamInvitesTable.invitedUserId, userDisplayView.userId))
    .where(eq(teamInvitesTable.teamId, teamId))
    .all();
}

export async function getTeamMembers(db: JJDrizzleDatabase, teamId: number): Promise<UserDisplay[]> {
  return db.select({
    userId: userDisplayView.userId,
    primaryLiveStream: userDisplayView.primaryLiveStream,
    role: userDisplayView.role,
    createdAt: userDisplayView.createdAt,
    username: userDisplayView.username,
    profileImage: userDisplayView.profileImage,
    twitchLogin: userDisplayView.twitchLogin,
    tiltifySlug: userDisplayView.tiltifySlug,
    tiltifyUrl: userDisplayView.tiltifyUrl,
    primaryColor: userDisplayView.primaryColor,
    accentColor: userDisplayView.accentColor,
  })
    .from(teamMembersTable)
    .innerJoin(userDisplayView, eq(teamMembersTable.userId, userDisplayView.userId))
    .where(eq(teamMembersTable.teamId, teamId))
    .all();
}

export async function getUserInvites(db: JJDrizzleDatabase, userId: number): Promise<{ teamId: number; name: string }[]> {
  return db.select({
    teamId: teamsTable.id,
    name: teamsTable.name
  })
    .from(teamInvitesTable)
    .innerJoin(teamsTable, eq(teamInvitesTable.teamId, teamsTable.id))
    .where(eq(teamInvitesTable.invitedUserId, userId))
    .all();
}

export async function getUserTeams(db: JJDrizzleDatabase, userId: number): Promise<Team[]> {
  return db.select({
    id: teamsTable.id,
    ownerId: teamsTable.ownerId,
    name: teamsTable.name,
    description: teamsTable.description,
    slug: teamsTable.slug,
    visible: teamsTable.visible,
  })
    .from(teamsTable)
    .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
    .where(eq(teamMembersTable.userId, userId))
    .all();
}



/**
 * Helper function to fetch teams owned by a specific user.
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch owned teams for
 * @returns Array of team objects where user is the owner
 */
async function getUserOwnedTeams(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: teamsTable.id,
    ownerId: teamsTable.ownerId,
    name: teamsTable.name,
    description: teamsTable.description,
    slug: teamsTable.slug,
    visible: teamsTable.visible,
  })
    .from(teamsTable)
    .where(eq(teamsTable.ownerId, userId))
    .all();
}

/**
 * Helper function to fetch teams where user is a member (not owner).
 *
 * @param db - Drizzle database instance
 * @param userId - ID of the user to fetch member teams for
 * @returns Array of team objects where user is a member but not owner
 */
async function getUserMemberTeams(db: JJDrizzleDatabase, userId: number) {
  return db.select({
    id: teamsTable.id,
    ownerId: teamsTable.ownerId,
    name: teamsTable.name,
    description: teamsTable.description,
    slug: teamsTable.slug,
    visible: teamsTable.visible,
  })
    .from(teamsTable)
    .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
    .where(and(
      eq(teamMembersTable.userId, userId),
      not(eq(teamsTable.ownerId, userId)) // Exclude teams where user is owner
    ))
    .all();
}

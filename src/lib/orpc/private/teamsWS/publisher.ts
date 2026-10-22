import {teamChannels} from "./channels.ts";

// After a mutation: the channel object reloads the list from D1 and sends it, but only when a
// socket is open. A failed update is logged, not thrown: the mutation has already been saved.

export async function publishUserInvitesUpdate(env: Env, userId: number) {
  try {
    const DO = env.UserTeamInvitesObject;
    await DO.get(DO.idFromName(teamChannels.userInvites(userId))).refresh(userId);
  } catch (e) {
    console.error('Error publishing UserTeamInvitesObject:', e);
  }
}

export async function publishUserTeamsUpdate(env: Env, userId: number) {
  try {
    const DO = env.UserTeamsObject;
    await DO.get(DO.idFromName(teamChannels.userTeams(userId))).refresh(userId);
  } catch (e) {
    console.error('Error publishing UserTeamsObject:', e);
  }
}

export async function publishTeamAdminInvitesUpdate(env: Env, teamId: number) {
  try {
    const DO = env.TeamAdminInvitesObject;
    await DO.get(DO.idFromName(teamChannels.teamAdminInvites(teamId))).refresh(teamId);
  } catch (e) {
    console.error('Error publishing TeamAdminInvitesObject:', e);
  }
}

export async function publishTeamAdminMembersUpdate(env: Env, teamId: number) {
  try {
    const DO = env.TeamAdminMembersObject;
    await DO.get(DO.idFromName(teamChannels.teamAdminMembers(teamId))).refresh(teamId);
  } catch (e) {
    console.error('Error publishing TeamAdminMembersObject:', e);
  }
}

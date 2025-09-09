import {getDB} from "../../../db/db.ts";
import {teamChannels} from "./channels.ts";
import {getTeamInvites, getTeamMembers, getUserInvites, getUserTeams} from "./util.ts";

export async function publishUserInvitesUpdate(env: Env, userId: number) {
  const db = getDB(env);
  const DO = env.UserTeamInvitesObject;
  const channelId = teamChannels.userInvites(userId);
  const stub = DO.get(DO.idFromName(channelId));
  const invites = await getUserInvites(db, userId);
  await stub.publishChange(invites);
}

export async function publishUserTeamsUpdate(env: Env, userId: number) {
  const db = getDB(env);
  const DO = env.UserTeamsObject;
  const channelId = teamChannels.userTeams(userId);
  const stub = DO.get(DO.idFromName(channelId));
  const teams = await getUserTeams(db, userId);
  await stub.publishChange(teams);
}

export async function publishTeamAdminInvitesUpdate(env: Env, teamId: number) {
  const db = getDB(env);
  const DO = env.TeamAdminInvitesObject;
  const channelId = teamChannels.teamAdminInvites(teamId);
  const stub = DO.get(DO.idFromName(channelId));
  const invites = await getTeamInvites(db, teamId);
  await stub.publishChange(invites);
}

export async function publishTeamAdminMembersUpdate(env: Env, teamId: number) {
  const db = getDB(env);
  const DO = env.TeamAdminMembersObject;
  const channelId = teamChannels.teamAdminMembers(teamId);
  const stub = DO.get(DO.idFromName(channelId));
  const members = await getTeamMembers(db, teamId);
  await stub.publishChange(members);
}

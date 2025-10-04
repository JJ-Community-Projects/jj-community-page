import {implement, ORPCError,} from "@orpc/server";
import {dbMiddleware} from "../../middleware/dbMiddleware.ts";
import {authMiddleware} from "../../middleware/authMiddleware.ts";
import { DurableIterator } from '@orpc/experimental-durable-iterator'
import {teamChannels} from "./channels.ts";
import type {UserTeamInvitesObject} from "./do/UserTeamInvitesObject.ts";
import type {UserTeamsObject} from "./do/UserTeamsObject.ts";
import type {TeamAdminInvitesObject} from "./do/TeamAdminInvitesObject.ts";
import type {TeamAdminMembersObject} from "./do/TeamAdminMembersObject.ts";
import {teamsOwnerMiddleware} from "../teams/middleware.ts";
import {privateTeamsWSContract} from "./contract.ts";

const os = implement(privateTeamsWSContract)
  .use(dbMiddleware)

// Per-user: pending team invites
const getUserTeamInvitesWS = os
  .getUserTeamInvitesWS
  .use(authMiddleware)
  .handler(async ({context}) => {
    const userId = context.userId
    try {
      const channelId = teamChannels.userInvites(userId);
      return new DurableIterator<UserTeamInvitesObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: { userId },
      });
    } catch (error) {
      console.error('Error in getUserTeamInvitesWS:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user team invites'});
    }
  });

// Per-user: teams (owned + member)
const getUserTeamsWS = os
  .getUserTeamsWS
  .use(authMiddleware)
  .handler(async ({context}) => {
    const userId = context.userId
    try {
      const channelId = teamChannels.userTeams(userId);
      return new DurableIterator<UserTeamsObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: { userId },
      });
    } catch (error) {
      console.error('Error in getUserTeamsWS:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream user teams'});
    }
  });

// Per-team-admin: pending invites
const getTeamAdminInvitesWS = os
  .getTeamAdminInvitesWS
  .use(teamsOwnerMiddleware)
  .handler(async ({context, input}) => {
    const teamId = input.teamId
    try {
      const channelId = teamChannels.teamAdminInvites(teamId);
      return new DurableIterator<TeamAdminInvitesObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: { teamId },
      });
    } catch (error) {
      console.error('Error in getTeamAdminInvitesWS:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream team admin invites'});
    }
  });

// Per-team-admin: members
const getTeamAdminMembersWS = os
  .getTeamAdminMembersWS
  // .use(teamsOwnerMiddleware)
  .handler(async ({context, input}) => {
    const teamId = input.teamId
    try {
      const channelId = teamChannels.teamAdminMembers(teamId);
      return new DurableIterator<TeamAdminMembersObject>(channelId, {
        signingKey: context.env!.ORPC_DEI_SIGNING_KEY,
        tokenTTLSeconds: 300,
        att: { teamId },
      });
    } catch (error) {
      console.error('Error in getTeamAdminMembersWS:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {message: 'Failed to stream team admin members'});
    }
  });

export const privateTeamsWSRouter = {
  getUserTeamInvitesWS,
  getUserTeamsWS,
  getTeamAdminInvitesWS,
  getTeamAdminMembersWS,
}

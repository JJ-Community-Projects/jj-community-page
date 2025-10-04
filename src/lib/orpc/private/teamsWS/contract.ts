import { z } from "zod/v4";
import { oc, type } from "@orpc/contract";
import { UserDisplaySchema } from "../schemas/users.ts";
import { TeamSchema } from "../../public/schemas/teams.ts";
import type { ClientDurableIterator } from '@orpc/experimental-durable-iterator/client'
import type { DurableIteratorObject } from '@orpc/experimental-durable-iterator'

// Teams WS Contracts (DEI-backed)

const TeamIdInput = z.object({ teamId: z.number().int().positive() });

type UserDisplay = z.infer<typeof UserDisplaySchema>;
type Team = z.infer<typeof TeamSchema>;

// Durable Event Iterator object interfaces matching DO payloads
export interface IUserTeamInvitesObject
  extends DurableIteratorObject<{ invites: { teamId: number; name: string }[]; event: 'update' }> {}

export interface IUserTeamsObject
  extends DurableIteratorObject<{ teams: Team[]; event: 'update' }> {}

export interface ITeamAdminInvitesObject
  extends DurableIteratorObject<{ invites: UserDisplay[]; event: 'update' }> {}

export interface ITeamAdminMembersObject
  extends DurableIteratorObject<{ members: UserDisplay[]; event: 'update' }> {}

// Per-user: pending team invites
const getUserTeamInvitesWS = oc.output(
  type<ClientDurableIterator<IUserTeamInvitesObject, never>>()
);

// Per-user: teams (owned + member)
const getUserTeamsWS = oc.output(
  type<ClientDurableIterator<IUserTeamsObject, never>>()
);

// Per-team-admin: pending invites
const getTeamAdminInvitesWS = oc
  .input(TeamIdInput)
  .output(type<ClientDurableIterator<ITeamAdminInvitesObject, never>>());

// Per-team-admin: members
const getTeamAdminMembersWS = oc
  .input(TeamIdInput)
  .output(type<ClientDurableIterator<ITeamAdminMembersObject, never>>());

export const privateTeamsWSContract = {
  getUserTeamInvitesWS,
  getUserTeamsWS,
  getTeamAdminInvitesWS,
  getTeamAdminMembersWS,
};

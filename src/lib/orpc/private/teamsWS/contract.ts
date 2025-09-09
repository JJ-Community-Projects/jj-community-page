import { z } from "zod/v4";
import { oc, type } from "@orpc/contract";
import { UserDisplaySchema } from "../schemas/users.ts";
import { TeamSchema } from "../../public/schemas/teams.ts";
import type { ClientDurableEventIterator } from "@orpc/experimental-durable-event-iterator/client";
import type { DurableEventIteratorObject } from "@orpc/experimental-durable-event-iterator";

// Teams WS Contracts (DEI-backed)

const TeamIdInput = z.object({ teamId: z.number().int().positive() });

type UserDisplay = z.infer<typeof UserDisplaySchema>;
type Team = z.infer<typeof TeamSchema>;

// Durable Event Iterator object interfaces matching DO payloads
export interface IUserTeamInvitesObject
  extends DurableEventIteratorObject<{ invites: { teamId: number; name: string }[]; event: 'update' }> {}

export interface IUserTeamsObject
  extends DurableEventIteratorObject<{ teams: Team[]; event: 'update' }> {}

export interface ITeamAdminInvitesObject
  extends DurableEventIteratorObject<{ invites: UserDisplay[]; event: 'update' }> {}

export interface ITeamAdminMembersObject
  extends DurableEventIteratorObject<{ members: UserDisplay[]; event: 'update' }> {}

// Per-user: pending team invites
const getUserTeamInvitesWS = oc.output(
  type<ClientDurableEventIterator<IUserTeamInvitesObject, never>>()
);

// Per-user: teams (owned + member)
const getUserTeamsWS = oc.output(
  type<ClientDurableEventIterator<IUserTeamsObject, never>>()
);

// Per-team-admin: pending invites
const getTeamAdminInvitesWS = oc
  .input(TeamIdInput)
  .output(type<ClientDurableEventIterator<ITeamAdminInvitesObject, never>>());

// Per-team-admin: members
const getTeamAdminMembersWS = oc
  .input(TeamIdInput)
  .output(type<ClientDurableEventIterator<ITeamAdminMembersObject, never>>());

export const privateTeamsWSContract = {
  getUserTeamInvitesWS,
  getUserTeamsWS,
  getTeamAdminInvitesWS,
  getTeamAdminMembersWS,
};

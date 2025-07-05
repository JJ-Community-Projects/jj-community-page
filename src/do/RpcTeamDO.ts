import {RpcTarget} from "cloudflare:workers";
import type {TeamDO} from "./TeamDO.ts";
import type {InferSelectModel} from "drizzle-orm";
import type {teamsTable} from "../lib/db/schema/schema.ts";


export class RpcTeamDO extends RpcTarget {
  private teamDO: TeamDO;
  private doIdentifier: string;
  protected env: Env

  constructor(doIdentifier: string, teamDO: TeamDO, env: Env) {
    super();
    this.teamDO = teamDO;
    this.doIdentifier = doIdentifier;
    this.env = env;
    this.teamDO.init(doIdentifier);
  }

  // Public methods that forward to the DO methods and inject the identifier

  async addInvite(invitedUserId: number, username: string) {
    return this.teamDO.addInvite(this.doIdentifier, invitedUserId, username);
  }

  async deleteInvite(invitedUserId: number) {
    return this.teamDO.deleteInvite(this.doIdentifier, invitedUserId);
  }

  async addTeamMember(userId: number, username: string) {
    return this.teamDO.addTeamMember(this.doIdentifier, userId, username);
  }

  async deleteTeamMember(userId: number) {
    return this.teamDO.deleteTeamMember(this.doIdentifier, userId);
  }

  async userLeaveTeam(userId: number) {
    return this.teamDO.userLeaveTeam(this.doIdentifier, userId);
  }

  async deleteTeam() {
    return this.teamDO.deleteTeam(this.doIdentifier);
  }

  async acceptInvite(userId: number, username: string) {
    return this.teamDO.acceptInvite(this.doIdentifier, userId, username);
  }

  async updateTeam(updates: {
    name?: string;
    slug?: string;
    description?: string;
    visible?: boolean;
  }) {
    return this.teamDO.updateTeam(this.doIdentifier, updates);
  }

  setTeam(team: InferSelectModel<typeof teamsTable>) {
    return this.teamDO.setTeam(this.doIdentifier, team)
  }

  // Methods that don't need the identifier can be forwarded directly

  /*
  async fetch(request: Request) {
    const token = request.headers.get('token')
    if (!token) {
      return createUnauthorizedResponse()
    }
    const {user, session} = await validateSessionTokenFromEnv(this.env, token)
    if (!user || !session) {
      return createUnauthorizedResponse()
    }
    const teamId = parseInt(this.doIdentifier);
    // TODO: Add permission check for team access
    return this.teamDO.fetch(request)
  }*/
}

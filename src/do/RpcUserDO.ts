import {RpcTarget} from "cloudflare:workers";
import {UserDO} from "./UserDO";
import {createUnauthorizedResponse} from "./utils.ts";
import {validateSessionTokenFromEnv} from "../functions/session.ts";
import {schedulesTable} from "../lib/db/schema/schema.ts";

export class RpcUserDO extends RpcTarget {
  private userDO: UserDO;
  private doIdentifier: string;
  protected env: Env

  constructor(doIdentifier: string, userDO: UserDO, env: Env) {
    super();
    this.userDO = userDO;
    this.doIdentifier = doIdentifier;
    this.env = env;
    this.userDO.init(doIdentifier);
  }

  // Public methods that forward to the DO methods and inject the identifier

  async addTag(tag: string, label: string) {
    return this.userDO.addTag(this.doIdentifier, tag, label);
  }

  async removeTag(tag: string) {
    return this.userDO.removeTag(this.doIdentifier, tag);
  }

  async addInvite(team: { id: number, name: string, slug: string, ownerId: number }) {
    return this.userDO.addInvite(this.doIdentifier, team);
  }

  async addTeam(team: { id: number, name: string, slug: string, ownerId: number }) {
    return this.userDO.addTeam(this.doIdentifier, team);
  }

  async acceptInvite(team: { id: number, name: string, slug: string, ownerId: number }) {
    return this.userDO.acceptInvite(this.doIdentifier, team);
  }

  async rejectInvite(teamId: number) {
    return this.userDO.rejectInvite(this.doIdentifier, teamId);
  }

  async leaveTeam(teamId: number) {
    return this.userDO.leaveTeam(this.doIdentifier, teamId);
  }

  async removedFromTeam(teamId: number) {
    return this.userDO.removedFromTeam(this.doIdentifier, teamId);
  }

  async teamDeleted(teamId: number) {
    return this.userDO.teamDeleted(this.doIdentifier, teamId);
  }

  async updateTeamInfo(updates: {
    teamId: number;
    name?: string;
    slug?: string;
    description?: string;
    visible?: boolean;
  }) {
    return this.userDO.updateTeamInfo(this.doIdentifier, updates);
  }

  async deleteSchedule(scheduleId: number) {
    return this.userDO.deleteSchedule(this.doIdentifier, scheduleId);
  }

  async setPrimarySchedule(scheduleId: number) {
    return this.userDO.setPrimarySchedule(this.doIdentifier, scheduleId);
  }

  async toggleScheduleVisibility(scheduleId: number) {
    return this.userDO.toggleScheduleVisibility(this.doIdentifier, scheduleId);
  }

  async addSocial(provider: string, url: string) {
    return this.userDO.addSocial(this.doIdentifier, provider, url);
  }

  async removeSocial(provider: string) {
    return this.userDO.removeSocial(this.doIdentifier, provider);
  }

  async updateUserStyle(primaryColor: string, accentColor: string) {
    return this.userDO.updateUserStyle(this.doIdentifier, primaryColor, accentColor);
  }

  async setPrimaryLiveStream(platform: string) {
    return this.userDO.setPrimaryLiveStream(this.doIdentifier, platform);
  }

  async addSchedule(schedule: typeof schedulesTable.$inferInsert & { id: number }) {
    return this.userDO.addSchedule(schedule);
  }

  // Methods that don't need the identifier can be forwarded directly

  async getTables() {
    return this.userDO.getTables();
  }

  async fetch(request: Request) {
    const token = request.headers.get('token')
    if (!token) {
      return createUnauthorizedResponse()
    }
    const {user, session} = await validateSessionTokenFromEnv(this.env, token)
    if (!user || !session) {
      return createUnauthorizedResponse()
    }
    const userId = parseInt(this.doIdentifier);
    if (user.id !== userId) {
      return createUnauthorizedResponse('wrong user id')
    }
    return this.userDO.fetch(request)
  }

  refresh() {
    return this.userDO.refresh(this.doIdentifier)
  }
}

import {TinybaseDO} from "./TinybaseDO.ts";
import {drizzle} from "drizzle-orm/d1";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../lib/db/schema/schema.ts";
import {and, eq} from "drizzle-orm";
import {accounts} from "../lib/db/schema/auth-schema.ts";
import {RpcTeamDO} from "./RpcTeamDO.ts";


export class TeamDO extends TinybaseDO {

  protected namespace(): string {
    return "TeamDO";
  }

  private parseTeamId(doIdentifier: string): number {
    return parseInt(doIdentifier);
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  init(doIdentifier: string) {
    this.ctx.blockConcurrencyWhile(async () => {
      this.createPersister();
      await this.loadTeamData(doIdentifier);
    });
  }

  setMetaData(doIdentifier: string) {
    return new RpcTeamDO(doIdentifier, this, this.env);
  }

  private async loadTeamData(doIdentifier: string) {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);
      const teamId = this.parseTeamId(doIdentifier);

      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId))
        .get()

      if (!team) {
        return
      }

      this.setTeam(doIdentifier, team);

      // Load team invites
      const invites = await db.select()
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.teamId, teamId))
        .all();

      // Load team members
      const members = await db.select({
        userId: teamMembersTable.userId,
        teamId: teamMembersTable.teamId,
        username: accounts.providerUsername
      })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, teamId))
        .innerJoin(accounts, eq(teamMembersTable.userId, accounts.userId))
        .all();

      // Update store with invites and members
      for (const invite of invites) {
        this.store.setRow('invites', `${invite.invitedUserId}`, invite);
      }

      for (const member of members) {
        this.store.setRow('members', `${member.userId}`, member);
      }
    } catch (e) {
      this.error('loadTeamData error:', e);
    }
  }

  async addInvite(doIdentifier: string, invitedUserId: number, username: string) {
    const store = this.store
    if (!store) {
      return
    }
    if (store.hasRow('invites', `${invitedUserId}`)) {
      return
    }
    const teamId = this.parseTeamId(doIdentifier);
    const invite = {
      invitedUserId: invitedUserId,
      teamId: teamId,
      username: username
    }
    const db = drizzle(this.env.DB);
    const [x] = await db.insert(teamInvitesTable)
      .values(invite).onConflictDoNothing()
    this.store?.setRow('invites', `${invitedUserId}`, invite)
  }

  async deleteInvite(doIdentifier: string, invitedUserId: number) {
    const store = this.store
    if (!store) {
      return
    }
    if (!store.hasRow('invites', `${invitedUserId}`)) {
      return
    }
    const db = drizzle(this.env.DB);
    const teamId = this.parseTeamId(doIdentifier);
    await db.delete(teamInvitesTable)
      .where(and(eq(teamInvitesTable.teamId, teamId), eq(teamInvitesTable.invitedUserId, invitedUserId)))
      .execute()
    store.delRow('invites', `${invitedUserId}`)
  }

  async addTeamMember(doIdentifier: string, userId: number, username: string) {
    const store = this.store
    if (!store) {
      return
    }
    if (store.hasRow('members', `${userId}`)) {
      return
    }

    const db = drizzle(this.env.DB);
    const teamId = this.parseTeamId(doIdentifier);
    const member = {
      userId: userId,
      teamId: teamId,
      username: username
    }
    await db.insert(teamMembersTable)
      .values(member)
      .execute()
    store.setRow('members', `${userId}`, member)
  }

  async deleteTeamMember(doIdentifier: string, userId: number) {
    const store = this.store
    if (!store) {
      return
    }
    if (!store.hasRow('members', `${userId}`)) {
      return
    }
    const db = drizzle(this.env.DB);
    const teamId = this.parseTeamId(doIdentifier);
    await db.delete(teamMembersTable)
      .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)))
      .execute()
    store.delRow('members', `${userId}`)
  }

  async userLeaveTeam(doIdentifier: string, userId: number) {
    // This is essentially the same as deleteTeamMember but with a different name
    // to make the intent clearer when called from the leave team action
    return this.deleteTeamMember(doIdentifier, userId);
  }

  async deleteTeam(doIdentifier: string) {
    const store = this.store;
    if (!store) {
      return;
    }

    const db = drizzle(this.env.DB);
    const teamId = this.parseTeamId(doIdentifier);

    // Clear the store (this will be propagated to clients)
    store.delTable('members');
    store.delTable('invites');

    // Delete all team members from the database
    await db.delete(teamMembersTable)
      .where(eq(teamMembersTable.teamId, teamId))
      .execute();

    // Delete all team invites from the database
    await db.delete(teamInvitesTable)
      .where(eq(teamInvitesTable.teamId, teamId))
      .execute();

    // Delete the team from the database
    await db.delete(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .execute();
  }

  async acceptInvite(doIdentifier: string, userId: number, username: string) {
    const store = this.store
    if (!store) {
      return
    }

    // Check if invite exists
    if (!store.hasRow('invites', `${userId}`)) {
      this.error('acceptInvite', 'Invite not found for user', userId);
      return
    }

    // Add user as team member
    await this.addTeamMember(doIdentifier, userId, username);

    // Delete the invite
    await this.deleteInvite(doIdentifier, userId);

    return true;
  }

  setTeam(doIdentifier: string, team: {
            id: number
            name: string
            ownerId: number
            description: string | null
            slug: string
            visible: boolean
          }
  ) {
    if (!this.store) {
      return
    }

    const teamId = this.parseTeamId(doIdentifier);

    this.store.setValues({
      teamId: teamId,
      name: team.name,
      ownerId: team.ownerId,
      description: team.description ?? '',
      slug: team.slug,
      visible: team.visible,
    })

    this.log('setTeam', teamId, team)

  }

  async updateTeam(doIdentifier: string, updates: {
    name?: string
    slug?: string
    description?: string
    visible?: boolean
  }) {
    if (!this.store) {
      return
    }

    const teamId = this.parseTeamId(doIdentifier);

    // Update only the provided fields
    const updateValues: Record<string, any> = {};

    if (updates.name !== undefined) {
      updateValues.name = updates.name;
    }

    if (updates.slug !== undefined) {
      updateValues.slug = updates.slug;
    }

    if (updates.description !== undefined) {
      updateValues.description = updates.description;
    }

    if (updates.visible !== undefined) {
      updateValues.visible = updates.visible;
    }

    // Apply updates to the store values
    this.store.setValues(updateValues);

    this.log('updateTeam', teamId, updates);

    // Update invites in the store with the new team information
    if ((updates.name !== undefined || updates.slug !== undefined) && this.store.hasTable('invites')) {
      const inviteIds = this.store.getRowIds('invites');
      for (const inviteId of inviteIds) {
        const invite = this.store.getRow('invites', inviteId);
        if (!invite) continue;

        const updatedInvite = {...invite};

        if (updates.name !== undefined) {
          updatedInvite.username = updates.name;
        }

        if (updates.slug !== undefined) {
          updatedInvite.slug = updates.slug;
        }

        this.store.setRow('invites', inviteId, updatedInvite);
      }

      this.log('updateTeam', 'Updated invites for team', teamId);
    }

    // Update all team members' UserDO with the new team information
    try {
      const db = drizzle(this.env.DB);

      // Get all team members
      const members = await db.select()
        .from(teamMembersTable)
        .where(eq(teamMembersTable.teamId, teamId))
        .all();

      // Update each member's UserDO
      for (const member of members) {
        try {
          const UserDO = this.env.UserDO;
          const userDoId = UserDO.idFromName(member.userId.toString());
          const userStub = UserDO.get(userDoId);

          await userStub.updateTeamInfo(member.userId.toString(), {
            teamId: teamId,
            ...updateValues
          });
        } catch (e) {
          this.error('Error updating UserDO for member', member.userId, e);
          // Continue with other members even if one fails
        }
      }
    } catch (e) {
      this.error('Error getting team members for UserDO updates', e);
    }

    // Also update all invited users' UserDO with the new team information
    try {
      const db = drizzle(this.env.DB);

      // Get all team invites
      const invites = await db.select()
        .from(teamInvitesTable)
        .where(eq(teamInvitesTable.teamId, teamId))
        .all();

      // Update each invited user's UserDO
      for (const invite of invites) {
        try {
          const UserDO = this.env.UserDO;
          const userDoId = UserDO.idFromName(invite.invitedUserId.toString());
          const userStub = UserDO.get(userDoId);

          await userStub.updateTeamInfo(invite.invitedUserId.toString(), {
            teamId: teamId,
            ...updateValues
          });
        } catch (e) {
          this.error('Error updating UserDO for invited user', invite.invitedUserId, e);
          // Continue with other invites even if one fails
        }
      }
    } catch (e) {
      this.error('Error getting team invites for UserDO updates', e);
    }
  }

}

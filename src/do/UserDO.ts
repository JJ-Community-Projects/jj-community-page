import {schedulesTable, teamInvitesTable, teamMembersTable, teamsTable} from "../lib/db/schema/schema.ts";
import {drizzle} from "drizzle-orm/d1";
import {and, eq} from "drizzle-orm";
import type {Id, IdAddedOrRemoved} from "tinybase";
import {TinybaseDO} from "./TinybaseDO.ts";
import {validateSessionTokenFromEnv} from "../functions/session.ts";
import {createUnauthorizedResponse} from "./utils.ts";
import {userSocials, userStyles, userTags} from "../lib/db/schema/auth-schema.ts";


export class UserDO extends TinybaseDO {

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.createPersister();
      await this.writeSchedulesToTinybase();
      await this.loadTeamInvites();
      await this.loadTeamMemberships();
      await this.loadUserTags();
      await this.loadUserSocials();
      await this.loadUserStyles();
    });
  }

  private async loadTeamMemberships() {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);

      // Load team memberships with team information for this user
      const memberships = await db.select({
        teamId: teamMembersTable.teamId,
        userId: teamMembersTable.userId,
        name: teamsTable.name,
        slug: teamsTable.slug,
        ownerId: teamsTable.ownerId,
      })
        .from(teamMembersTable)
        .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
        .where(eq(teamMembersTable.userId, this.userId))
        .all();

      // Update store with team memberships including team information
      for (const membership of memberships) {
        this.store.setRow('teamMembers', `${membership.teamId}`, membership);
      }
    } catch (e) {
      this.error('loadTeamMemberships error:', e);
    }
  }


  private async loadTeamInvites() {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);

      // Load team invites for this user with team information
      const invites = await db.select({
        teamId: teamInvitesTable.teamId,
        invitedUserId: teamInvitesTable.invitedUserId,
        name: teamsTable.name,
        slug: teamsTable.slug,
        ownerId: teamsTable.ownerId
      })
        .from(teamInvitesTable)
        .innerJoin(teamsTable, eq(teamInvitesTable.teamId, teamsTable.id))
        .where(eq(teamInvitesTable.invitedUserId, this.userId))
        .all();

      // Update store with invites including team information
      for (const invite of invites) {
        this.store.setRow('invites', `${invite.teamId}`, invite);
      }
    } catch (e) {
      this.error('loadTeamInvites error:', e);
    }
  }

  protected namespace(): string {
    return "UserDO";
  }

  // This method is called internally by the system, not directly by clients
  async addSchedule(schedule: typeof schedulesTable.$inferInsert & { id: number }) {
    this.log(schedule.ownerId, 'addSchedule', schedule);
    try {
      // Check if store creation was successful
      if (!this.store) {
        this.error('addSchedule', 'Failed to access store');
        return;
      }

      await this.store.transaction(async () => {
        // Set user ID in values schema
        this.store!.setValue('id', schedule.ownerId);

        // Add the schedule to the store
        this.store!.setRow('schedules', `${schedule.id}`, {
          id: schedule.id,
          title: schedule.title,
          year: schedule.year,
          visible: schedule.visible,
          primary: schedule.primary!,
          slug: schedule.slug,
        });
      });

      this.log('addSchedule', 'Schedule added successfully');
    } catch (error) {
      this.error('addSchedule', 'Error adding schedule:', error);
    }
  }


  // This method is called internally by the system, not directly by clients
  async loadUserSchedules() {
    const userId = this.ctx.id.name
    if (!userId) {
      this.error('loadUserSchedules', 'No userId found.');
      return;
    }
    this.log(userId, 'loadUserSchedules');
    await this.ctx.storage.put('userId', userId);


    // Get database connection
    if (!this.store) {
      this.error('loadUserSchedules', 'Failed to access store');
      return;
    }

    try {
      const db = drizzle(this.env.DB);
      // Load schedules from database
      const schedules = await db.select().from(schedulesTable)
        .where(eq(schedulesTable.ownerId, parseInt(userId)))
        .all();
      this.log('loadSchedules', 'D1', schedules);

      await this.store.transaction(async () => {

        // Add schedules to the store
        for (const schedule of schedules) {
          this.log('loadUserSchedules', 'setRow', 'schedules', `${schedule.id}`, schedule);
          this.store!.setRow('schedules', `${schedule.id}`, {
            id: schedule.id,
            title: schedule.title,
            year: schedule.year,
            visible: schedule.visible,
            primary: schedule.primary,
            slug: schedule.slug,
          });
        }
      });
      this.log('loadUserSchedules', 'done');
    } catch (error) {
      this.error('loadUserSchedules', 'Error loading schedules:', error);
    }
  }


  async onMessage(fromClientId: Id, toClientId: Id, message: string) {
    super.onMessage(fromClientId, toClientId, message)

    // this.info('Message received on path: ', this.getPathId());
    // this.log( 'onMessage', fromClientId, toClientId, message);

    const lst = await this.ctx.storage.list()
    // this.log('lst', lst)
  }

  onPathId(pathId: Id, addedOrRemoved: IdAddedOrRemoved) {
    super.onPathId(pathId, addedOrRemoved);
    // this.info((addedOrRemoved ? 'Added' : 'Removed') + ` path ${pathId}`);
  }

  onClientId(pathId: Id, clientId: Id, addedOrRemoved: IdAddedOrRemoved) {
    super.onClientId(pathId, clientId, addedOrRemoved);
    // this.info((addedOrRemoved ? 'Added' : 'Removed') + ` client ${clientId} on path ${pathId}`,);
  }

  public getTables() {
    return this.store?.getTables()
  }

  private loadSchedulesFromD1() {
    const id = this.ctx.id.name
    if (!id) {
      return null;
    }
    this.log('loadSchedulesFromD1', id);
    const db = drizzle(this.env.DB)
    return db.select().from(schedulesTable)
      .where(eq(schedulesTable.ownerId, parseInt(id))).all()
  }

  private async writeSchedulesToTinybase() {
    if (!this.store) {
      return
    }
    const schedules = await this.loadSchedulesFromD1()
    if (!schedules) {
      return;
    }
    this.log('writeSchedulesToTinybase')
    await this.store.transaction(async () => {
      for (const schedule of schedules) {
        this.store!.setRow('schedules', `${schedule.id}`, {
          id: schedule.id,
          title: schedule.title,
          year: schedule.year,
          visible: schedule.visible,
          primary: schedule.primary,
          slug: schedule.slug,
        })
      }
    })

  }

  private get userId() {
    return parseInt(this.ctx.id.name ?? '')
  }

  private async loadUserTags() {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);

      // Load user tags from database
      const tags = await db.select()
        .from(userTags)
        .where(eq(userTags.userId, this.userId))
        .all();

      // Update store with user tags
      for (const tag of tags) {
        this.store.setRow('userTags', tag.tag, {
          tag: tag.tag,
          label: tag.label,
          addedAt: tag.addedAt.toISOString()
        });
      }
    } catch (e) {
      this.error('loadUserTags error:', e);
    }
  }

  async addTag(tag: string, label: string) {
    if (!this.store) {
      this.error('addTag', 'Store not initialized');
      return false;
    }

    try {
      // Sanitize tag (lowercase, no spaces)
      const sanitizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');

      // Check if tag already exists
      if (this.store.hasRow('userTags', sanitizedTag)) {
        this.log('addTag', 'Tag already exists', sanitizedTag);
        return true;
      }

      // Add tag to database
      const db = drizzle(this.env.DB);
      await db.insert(userTags)
        .values({
          userId: this.userId,
          tag: sanitizedTag,
          label: label || sanitizedTag,
          addedAt: new Date()
        });

      // Add tag to store
      this.store.setRow('userTags', sanitizedTag, {
        tag: sanitizedTag,
        label: label || sanitizedTag,
        addedAt: new Date().toISOString()
      });

      this.log('addTag', 'Tag added successfully', sanitizedTag);
      return true;
    } catch (e) {
      this.error('addTag error:', e);
      return false;
    }
  }

  async removeTag(tag: string) {
    if (!this.store) {
      this.error('removeTag', 'Store not initialized');
      return false;
    }

    try {
      // Sanitize tag (lowercase, no spaces)
      const sanitizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');

      // Check if tag exists
      if (!this.store.hasRow('userTags', sanitizedTag)) {
        this.log('removeTag', 'Tag does not exist', sanitizedTag);
        return true;
      }

      // Remove tag from database
      const db = drizzle(this.env.DB);
      await db.delete(userTags)
        .where(
          and(
            eq(userTags.userId, this.userId),
            eq(userTags.tag, sanitizedTag)
          )
        );

      // Remove tag from store
      this.store.delRow('userTags', sanitizedTag);

      this.log('removeTag', 'Tag removed successfully', sanitizedTag);
      return true;
    } catch (e) {
      this.error('removeTag error:', e);
      return false;
    }
  }


  async addInvite(team: { id: number, name: string, slug: string, ownerId: number }) {
    const store = this.store;
    if (!store) {
      return
    }
    if (store.hasRow('invites', `${team.id}`)) {
      return
    }
    const db = drizzle(this.env.DB);
    await db.insert(teamInvitesTable)
      .values({
        invitedUserId: this.userId,
        teamId: team.id,
      }).onConflictDoNothing()
    this.store?.setRow('invites', `${team.id}`, {
      invitedUserId: this.userId,
      teamId: team.id,
      name: team.name,
      slug: team.slug,
      ownerId: team.ownerId,
    })
  }

  async addTeam(team: { id: number, name: string, slug: string, ownerId: number }) {
    const store = this.store;
    if (!store) {
      return;
    }

    // Add the team to teamMembers with complete team information
    store.setRow('teamMembers', `${team.id}`, {
      teamId: team.id,
      userId: this.userId,
      name: team.name,
      slug: team.slug,
      ownerId: team.ownerId,
    });

    return true;
  }

  async acceptInvite(team: { id: number, name: string, slug: string, ownerId: number }) {
    const store = this.store;
    if (!store) {
      return;
    }

    // Check if invite exists
    if (!store.hasRow('invites', `${team.id}`)) {
      this.error('acceptInvite', 'Invite not found for team', team.id);
      return;
    }

    // Remove the invite from the store
    store.delRow('invites', `${team.id}`);

    // Add the team to teamMembers with complete team information
    if (team) {
      store.setRow('teamMembers', `${team.id}`, {
        teamId: team.id,
        name: team.name,
        slug: team.slug,
        ownerId: team.ownerId,
      });
    }

    // Note: The actual database update is handled by the TeamDO
    // which will add the user as a team member and delete the invite

    return true;
  }

  async rejectInvite(teamId: number) {
    const store = this.store;
    if (!store) {
      return;
    }

    // Check if invite exists
    if (!store.hasRow('invites', `${teamId}`)) {
      this.error('rejectInvite', 'Invite not found for team', teamId);
      return;
    }

    // Remove the invite from the store
    store.delRow('invites', `${teamId}`);

    // Note: The actual database update is handled by the TeamDO
    // which will delete the invite

    return true;
  }

  async leaveTeam(teamId: number) {
    const store = this.store;
    if (!store) {
      return;
    }

    // Check if user is a member of the team
    if (!store.hasRow('teamMembers', `${teamId}`)) {
      this.error('leaveTeam', 'User is not a member of team', teamId);
      return;
    }

    // Remove the team membership from the store
    store.delRow('teamMembers', `${teamId}`);

    // Note: The actual database update is handled by the TeamDO
    // which will delete the team member record

    return true;
  }

  async removedFromTeam(teamId: number) {
    // This is essentially the same as leaveTeam but with a different name
    // to make the intent clearer when called from the remove user action
    return this.leaveTeam(teamId);
  }

  async teamDeleted(teamId: number) {
    const store = this.store;
    if (!store) {
      return;
    }

    // Remove team membership if it exists
    if (store.hasRow('teamMembers', `${teamId}`)) {
      store.delRow('teamMembers', `${teamId}`);
    }

    // Remove team invite if it exists
    if (store.hasRow('invites', `${teamId}`)) {
      store.delRow('invites', `${teamId}`);
    }

    return true;
  }

  async updateTeamßInfo(updates: {
    teamId: number;
    name?: string;
    slug?: string;
    description?: string;
    visible?: boolean;
  }) {
    const store = this.store;
    if (!store) {
      return;
    }

    const teamId = updates.teamId;

    // Update team membership if user is a member of this team
    if (store.hasRow('teamMembers', `${teamId}`)) {
      // Get current team data
      const currentTeamData = store.getRow('teamMembers', `${teamId}`);
      if (!currentTeamData) {
        this.error('updateTeamInfo', 'Failed to get current team data', teamId);
        return;
      }

      // Create updated team data by merging current data with updates
      const updatedTeamData = {
        ...currentTeamData,
      };

      // Update only the fields that were provided
      if (updates.name !== undefined) {
        updatedTeamData.name = updates.name;
      }

      if (updates.slug !== undefined) {
        updatedTeamData.slug = updates.slug;
      }

      if (updates.description !== undefined) {
        updatedTeamData.description = updates.description;
      }

      if (updates.visible !== undefined) {
        updatedTeamData.visible = updates.visible;
      }

      // Update the team data in the store
      store.setRow('teamMembers', `${teamId}`, updatedTeamData);

      this.log('updateTeamInfo', 'Updated team membership info for team', teamId);
    }

    // Update team invite if user has an invite for this team
    if (store.hasRow('invites', `${teamId}`)) {
      // Get current invite data
      const currentInviteData = store.getRow('invites', `${teamId}`);
      if (!currentInviteData) {
        this.error('updateTeamInfo', 'Failed to get current invite data', teamId);
        return;
      }

      // Create updated invite data by merging current data with updates
      const updatedInviteData = {
        ...currentInviteData,
      };

      // Update only the fields that were provided
      if (updates.name !== undefined) {
        updatedInviteData.name = updates.name;
      }

      if (updates.slug !== undefined) {
        updatedInviteData.slug = updates.slug;
      }

      // Update the invite data in the store
      store.setRow('invites', `${teamId}`, updatedInviteData);

      this.log('updateTeamInfo', 'Updated team invite info for team', teamId);
    }

    return true;
  }

  async deleteSchedule(scheduleId: number) {
    const store = this.store;
    if (!store) {
      this.error('deleteSchedule', 'Failed to access store');
      return;
    }

    // Check if schedule exists in the store
    if (!store.hasRow('schedules', `${scheduleId}`)) {
      this.error('deleteSchedule', 'Schedule not found', scheduleId);
      return;
    }

    // Remove the schedule from the store
    store.delRow('schedules', `${scheduleId}`);

    this.log('deleteSchedule', 'Schedule removed successfully', scheduleId);
    return true;
  }

  /**
   * Set a schedule as primary and all other schedules with the same year as non-primary
   *
   * @param scheduleId - The ID of the schedule to set as primary
   * @returns Promise resolving to a boolean indicating success
   */
  async setPrimarySchedule(scheduleId: number) {
    if (!this.store) {
      this.error('setPrimarySchedule', 'Store not initialized');
      return false;
    }

    try {
      // Get database connection
      const db = drizzle(this.env.DB);

      // Get the schedule to find its year
      const schedule = await db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        this.error('setPrimarySchedule', 'Schedule not found', scheduleId);
        return false;
      }

      // Import the and function for combining conditions
      const {and, not} = await import("drizzle-orm");

      // 1. Set the target schedule as primary
      await db.update(schedulesTable)
        .set({ primary: true })
        .where(eq(schedulesTable.id, scheduleId));

      // 2. Set all other schedules with the same year as non-primary
      await db.update(schedulesTable)
        .set({ primary: false })
        .where(
          and(
            eq(schedulesTable.year, schedule.year),
            eq(schedulesTable.ownerId, this.userId),
            not(eq(schedulesTable.id, scheduleId))
          )
        );

      // Update the store
      await this.store.transaction(async () => {
        // Update the target schedule
        if (this.store!.hasRow('schedules', `${scheduleId}`)) {
          this.store!.setCell('schedules', `${scheduleId}`, 'primary', true);
        }

        // Update all other schedules with the same year
        const scheduleIds = this.store!.getRowIds('schedules');
        console.log(scheduleIds)
        for (const id of scheduleIds) {
          const storeSchedule = this.store!.getRow('schedules', id);
          if (storeSchedule &&
              storeSchedule.year === schedule.year &&
              parseInt(id) !== scheduleId) {
            this.store!.setCell('schedules', id, 'primary', false);
          }
        }
      });

      this.log('setPrimarySchedule', 'Schedule set as primary successfully', scheduleId);
      return true;
    } catch (e) {
      this.error('setPrimarySchedule error:', e);
      return false;
    }
  }

  /**
   * Toggle the visibility of a schedule
   *
   * @param scheduleId - The ID of the schedule to toggle visibility
   * @returns Promise resolving to a boolean indicating success
   */
  async toggleScheduleVisibility(scheduleId: number) {
    if (!this.store) {
      this.error('toggleScheduleVisibility', 'Store not initialized');
      return false;
    }

    try {
      // Get database connection
      const db = drizzle(this.env.DB);

      // Get the current schedule
      const schedule = await db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get();

      if (!schedule) {
        this.error('toggleScheduleVisibility', 'Schedule not found', scheduleId);
        return false;
      }

      // Toggle the visibility
      const newVisibility = !schedule.visible;

      // Update the database
      await db.update(schedulesTable)
        .set({ visible: newVisibility })
        .where(eq(schedulesTable.id, scheduleId));

      // Update the store
      if (this.store.hasRow('schedules', `${scheduleId}`)) {
        this.store.setCell('schedules', `${scheduleId}`, 'visible', newVisibility);
      }

      this.log('toggleScheduleVisibility', `Schedule visibility set to ${newVisibility}`, scheduleId);
      return true;
    } catch (e) {
      this.error('toggleScheduleVisibility error:', e);
      return false;
    }
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
    if (user.id !== this.userId) {
      return createUnauthorizedResponse('wrong user id')
    }
    return this.defaultFetch(request)
  }

  private async loadUserSocials() {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);

      // Load user socials from database
      const socials = await db.select()
        .from(userSocials)
        .where(eq(userSocials.userId, this.userId))
        .all();

      // Update store with user socials
      for (const social of socials) {
        this.store.setRow('userSocials', social.provider, {
          provider: social.provider,
          url: social.url
        });
      }
    } catch (e) {
      this.error('loadUserSocials error:', e);
    }
  }

  async addSocial(provider: string, url: string) {
    if (!this.store) {
      this.error('addSocial', 'Store not initialized');
      return false;
    }

    try {
      // Validate provider (should be one of twitch, twitter, bsky, youtube, instagram, tiktok)
      if (!['twitch', 'twitter', 'bsky', 'youtube', 'instagram', 'tiktok'].includes(provider.toLowerCase())) {
        this.error('addSocial', 'Invalid provider', provider);
        return false;
      }

      // Normalize provider to lowercase
      const normalizedProvider = provider.toLowerCase();

      // Add social to database
      const db = drizzle(this.env.DB);
      await db.insert(userSocials)
        .values({
          userId: this.userId,
          provider: normalizedProvider,
          url: url
        })
        .onConflictDoUpdate({
          target: [userSocials.userId, userSocials.provider],
          set: { url: url }
        });

      // Add social to store
      this.store.setRow('userSocials', normalizedProvider, {
        provider: normalizedProvider,
        url: url
      });

      this.log('addSocial', 'Social added successfully', normalizedProvider);
      return true;
    } catch (e) {
      this.error('addSocial error:', e);
      return false;
    }
  }

  async removeSocial(provider: string) {
    if (!this.store) {
      this.error('removeSocial', 'Store not initialized');
      return false;
    }

    try {
      // Normalize provider to lowercase
      const normalizedProvider = provider.toLowerCase();

      // Check if social exists
      if (!this.store.hasRow('userSocials', normalizedProvider)) {
        this.log('removeSocial', 'Social does not exist', normalizedProvider);
        return true;
      }

      // Remove social from database
      const db = drizzle(this.env.DB);
      await db.delete(userSocials)
        .where(
          and(
            eq(userSocials.userId, this.userId),
            eq(userSocials.provider, normalizedProvider)
          )
        );

      // Remove social from store
      this.store.delRow('userSocials', normalizedProvider);

      this.log('removeSocial', 'Social removed successfully', normalizedProvider);
      return true;
    } catch (e) {
      this.error('removeSocial error:', e);
      return false;
    }
  }

  private async loadUserStyles() {
    if (!this.store) {
      return;
    }

    try {
      const db = drizzle(this.env.DB);

      // Load user style from database
      const style = await db.select()
        .from(userStyles)
        .where(eq(userStyles.userId, this.userId))
        .get();

      // Update store with user style if it exists
      if (style) {
        this.store.setRow('userStyle', 'style', {
          primaryColor: style.primaryColor,
          accentColor: style.accentColor
        });
      }
    } catch (e) {
      this.error('loadUserStyles error:', e);
    }
  }

  async updateUserStyle(primaryColor: string, accentColor: string) {
    if (!this.store) {
      this.error('updateUserStyle', 'Store not initialized');
      return false;
    }

    try {
      // Update style in database
      const db = drizzle(this.env.DB);
      await db.insert(userStyles)
        .values({
          userId: this.userId,
          primaryColor: primaryColor,
          accentColor: accentColor
        })
        .onConflictDoUpdate({
          target: [userStyles.userId],
          set: {
            primaryColor: primaryColor,
            accentColor: accentColor
          }
        });

      // Update style in store
      this.store.setRow('userStyle', 'style', {
        primaryColor: primaryColor,
        accentColor: accentColor
      });

      this.log('updateUserStyle', 'User style updated successfully');
      return true;
    } catch (e) {
      this.error('updateUserStyle error:', e);
      return false;
    }
  }
}

import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {getDB} from "../lib/db/db.ts";
import {teamInvitesTable, teamMembersTable, teamsTable} from "../lib/db/schema/schema.ts";
import {and, eq} from "drizzle-orm";
import {accounts} from "../lib/db/schema/auth-schema.ts";
import {createSlug, generateTeamSlugAlternatives} from "../functions/slug.ts";


export const teams = {
  create: defineAction({
    input: z.object({
      name: z.string(),
      slug: z.string(),
    }),
    handler: async ({name, slug}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }
      if (!slug) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is required'})
      }
      if (!name) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'name is required'})
      }

      // Create a proper slug using the createSlug function
      slug = createSlug(slug);

      if (!slug) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Invalid slug'})
      }

      const db = getDB(ctx)

      // Check if slug is available
      let dbResult;
      try {
        dbResult = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.slug, slug))
      } catch (e: any) {
        console.error('Error checking slug availability:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      const isSlugAvailable = dbResult.length === 0;
      if (!isSlugAvailable) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is used'})
      }

      // Create team in database
      let team;
      try {
        [team] = await db.insert(teamsTable)
          .values({
            name: name,
            slug: slug,
            ownerId: user.id,
          }).returning()
      } catch (e: any) {
        console.error('Error creating team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize TeamDO and add creator as a member
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${team.id}`)
        const teamStub = TeamDO.get(teamDoId)
        teamStub.setTeam(team)
        // Add team creator as a member
        await teamStub.addTeamMember(user.id, user.tiltifyName)
      } catch (e: any) {
        console.error('Error initializing TeamDO or adding team creator as member:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO and update user's team memberships
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(`${user.id}`)
        const userStub = UserDO.get(userDoId)

        // Add team to user's memberships
        await userStub.addTeam({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        })
      } catch (e: any) {
        console.error('Error initializing UserDO or updating user team memberships:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return team.id
    }
  }),
  update: defineAction({
    input: z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    }),
    handler: async ({id, name, slug}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }
      if (!slug) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is required'})
      }
      if (!name) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'name is required'})
      }

      const db = getDB(ctx)

      // Check if team exists and user is the owner
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, id))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can update teams
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can update teams'})
      }

      // Check if slug is available (if it's changed)
      if (slug !== team.slug) {
        let dbResult;
        try {
          dbResult = await db.select()
            .from(teamsTable)
            .where(eq(teamsTable.slug, slug))
        } catch (e: any) {
          console.error('Error checking slug availability:', e);
          throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
        }

        const isSlugAvailable = dbResult.length === 0;
        if (!isSlugAvailable) {
          throw new ActionError({code: 'BAD_REQUEST', message: 'slug is already in use'})
        }
      }

      // Update team in database
      let updatedTeam;
      try {
        [updatedTeam] = await db.update(teamsTable)
          .set({
            name: name,
            slug: slug,
          })
          .where(eq(teamsTable.id, id))
          .returning()
      } catch (e: any) {
        console.error('Error updating team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update TeamDO
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${id}`)
        const teamStub = TeamDO.get(teamDoId)
        await teamStub.updateTeam({
          name: name,
          slug: slug,
        })
      } catch (e: any) {
        console.error('Error updating TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return updatedTeam
    }
  }),
  deleteTeam: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists and user is the owner
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can delete teams
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can delete teams'})
      }

      // Get all team members from the database
      let memberIds: number[] = [];
      try {
        const members = await db.select()
          .from(teamMembersTable)
          .where(eq(teamMembersTable.teamId, teamId))
          .all();

        memberIds = members.map(member => member.userId);
      } catch (e: any) {
        console.error('Error fetching team members:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Delete team
      try {
        await teamStub.deleteTeam()
      } catch (e: any) {
        console.error('Error deleting team in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO for each team member
      if (memberIds.length > 0) {
        const UserDO = ctx.locals.runtime.env.UserDO

        for (const memberId of memberIds) {
          try {
            const userDoId = UserDO.idFromName(memberId.toString())
            const userStub = UserDO.get(userDoId)
            await userStub.teamDeleted(teamId)
          } catch (e: any) {
            console.error(`Error updating UserDO for member ${memberId}:`, e);
            // Continue with other members even if one fails
          }
        }
      }

      return {success: true}
    }
  }),
  leaveTeam: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Prevent team owner from leaving their own team
      if (team.ownerId === user.id) {
        throw new ActionError({
          code: 'FORBIDDEN',
          message: 'Team owner cannot leave their own team. Transfer ownership or delete the team instead.'
        })
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Remove user from team
      try {
        await teamStub.userLeaveTeam(user.id)
      } catch (e: any) {
        console.error('Error leaving team in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(user.id.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO state
      try {
        await userStub.leaveTeam(teamId)
      } catch (e: any) {
        console.error('Error updating UserDO after leaving team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
  removeUser: defineAction({
    input: z.object({
      userId: z.number(),
      teamId: z.number(),
    }),
    handler: async ({userId, teamId}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists and user is the owner
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can remove users
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can remove users'})
      }

      // Prevent team owner from removing themselves
      if (userId === user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Team owner cannot remove themselves from the team'})
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Remove user from team
      try {
        await teamStub.deleteTeamMember(userId)
      } catch (e: any) {
        console.error('Error removing user from team in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(userId.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO state
      try {
        await userStub.removedFromTeam(teamId)
      } catch (e: any) {
        console.error('Error updating UserDO after removing user from team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
  isSlugValid: defineAction({
    input: z.object({
      slug: z.string(),
      tiltifyName: z.string().optional(),
    }),
    handler: async ({slug, tiltifyName}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }
      if (!slug) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is required'})
      }

      // Get alternatives using the generateTeamSlugAlternatives function
      // If it returns alternatives, the slug is not valid
      const alternatives = await generateTeamSlugAlternatives(ctx, slug, 3);

      // If alternatives is empty, the slug is valid
      if (alternatives.length === 0) {
        return {
          isValid: true,
          suggestions: []
        };
      }

      // Add tiltifyName as a suggestion if provided and different from slug
      let allAlternatives = [...alternatives];

      if (tiltifyName && tiltifyName.toLowerCase() !== slug.toLowerCase()) {
        const tiltifySlug = createSlug(tiltifyName);
        // Check if this slug is valid using generateTeamSlugAlternatives
        // If it returns an empty array, the slug is valid
        const tiltifyAlternatives = await generateTeamSlugAlternatives(ctx, tiltifySlug, 0);
        if (tiltifyAlternatives.length === 0) {
          allAlternatives.push(tiltifySlug);
        }
      } else if (user.tiltifyName && user.tiltifyName.toLowerCase() !== slug.toLowerCase()) {
        const userTiltifySlug = createSlug(user.tiltifyName);
        // Check if this slug is valid using generateTeamSlugAlternatives
        // If it returns an empty array, the slug is valid
        const userTiltifyAlternatives = await generateTeamSlugAlternatives(ctx, userTiltifySlug, 0);
        if (userTiltifyAlternatives.length === 0) {
          allAlternatives.push(userTiltifySlug);
        }
      }

      return {
        isValid: false,
        suggestions: allAlternatives
      };
    }
  }),
}

export const teamInvites = {
  invite: defineAction({
    input: z.object({
      invitedUserId: z.number(),
      teamId: z.number(),
    }),
    handler: async ({invitedUserId, teamId}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists and user is the owner
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can invite people
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can invite users'})
      }

      // Initialize TeamDO and add invite
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      console.log('invitedUserId', invitedUserId)
      let userToInvite
      try {
        userToInvite = await db.select()
          .from(accounts)
          .where(and(
            eq(accounts.userId, invitedUserId),
            eq(accounts.provider, 'tiltify')
          ))
          .get()
      } catch (e: any) {
        console.error('Error initializing UserToInvite:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      console.log('userToInvite', userToInvite)

      if (!userToInvite) {
        console.error('Error initializing UserToInvite:', 'user not found');
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: 'user not found'})
      }

      try {
        await teamStub.addInvite(invitedUserId, userToInvite.providerUsername)
      } catch (e: any) {
        console.error('Error adding invite to TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO and add invite
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(invitedUserId.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      try {
        await userStub.addInvite({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        })
      } catch (e: any) {
        console.error('Error adding invite to UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
  removeInvite: defineAction({
    input: z.object({
      invitedUserId: z.number(),
      teamId: z.number(),
    }),
    handler: async ({invitedUserId, teamId}, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists and user is the owner
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can remove invites
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can remove invites'})
      }

      // Check if invite exists
      let invite;
      try {
        invite = await db.select()
          .from(teamInvitesTable)
          .where(
            and(
              eq(teamInvitesTable.teamId, teamId),
              eq(teamInvitesTable.invitedUserId, invitedUserId)
            )
          )
          .get()
      } catch (e: any) {
        console.error('Error fetching invite:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!invite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Delete invite from TeamDO
      try {
        await teamStub.deleteInvite(invitedUserId)
      } catch (e: any) {
        console.error('Error deleting invite in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(invitedUserId.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO state
      try {
        await userStub.rejectInvite(teamId)
      } catch (e: any) {
        console.error('Error rejecting invite in UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
  acceptInvite: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Check if user has an invite
      let invite;
      try {
        invite = await db.select()
          .from(teamInvitesTable)
          .where(
            and(
              eq(teamInvitesTable.teamId, teamId),
              eq(teamInvitesTable.invitedUserId, user.id)
            )
          )
          .get()
      } catch (e: any) {
        console.error('Error fetching invite:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!invite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Add user as team member and delete invite
      try {
        await teamStub.acceptInvite(user.id, user.tiltifyName)
      } catch (e: any) {
        console.error('Error accepting invite in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(user.id.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO state with complete team object
      try {
        await userStub.acceptInvite({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        })
      } catch (e: any) {
        console.error('Error accepting invite in UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
  rejectInvite: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const db = getDB(ctx)

      // Check if team exists
      let team;
      try {
        team = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.id, teamId))
          .get()
      } catch (e: any) {
        console.error('Error fetching team:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Check if user has an invite
      let invite;
      try {
        invite = await db.select()
          .from(teamInvitesTable)
          .where(
            and(
              eq(teamInvitesTable.teamId, teamId),
              eq(teamInvitesTable.invitedUserId, user.id)
            )
          )
          .get()
      } catch (e: any) {
        console.error('Error fetching invite:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      if (!invite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      // Initialize TeamDO
      let teamStub;
      try {
        const TeamDO = ctx.locals.runtime.env.TeamDO
        const teamDoId = TeamDO.idFromName(`${teamId}`)
        teamStub = TeamDO.get(teamDoId)
      } catch (e: any) {
        console.error('Error initializing TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Delete invite from TeamDO
      try {
        await teamStub.deleteInvite(user.id)
      } catch (e: any) {
        console.error('Error deleting invite in TeamDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Initialize UserDO
      let userStub;
      try {
        const UserDO = ctx.locals.runtime.env.UserDO
        const userDoId = UserDO.idFromName(user.id.toString())
        userStub = UserDO.get(userDoId)
      } catch (e: any) {
        console.error('Error initializing UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Update UserDO state
      try {
        await userStub.rejectInvite(teamId)
      } catch (e: any) {
        console.error('Error rejecting invite in UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {success: true}
    }
  }),
}

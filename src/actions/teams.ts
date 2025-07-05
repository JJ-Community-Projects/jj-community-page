import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {createSlug, generateTeamSlugAlternatives} from "../functions/slug.ts";
import {TeamRepo} from "../lib/db/repos/TeamRepo.ts";
import {UserRepo} from "../lib/db/repos/UserRepo.ts";
import {useRpcTeamDO, useRpcUserDO} from "./getDO.ts";


export const teams = {
  /**
   * Creates a new team with the authenticated user as owner.
   * Input: An object containing:
   *   - name (string) - The name of the team
   *   - slug (string) - The slug for the team URL
   * Action: Creates a team in the database, initializes the TeamDO, and adds the creator as a member.
   * Returns: The ID of the created team.
   */
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

      const teams = TeamRepo.action(ctx);

      // Check if slug is available
      const existingTeam = await teams.findBySlug(slug);
      if (existingTeam) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'slug is used'})
      }

      // Create team in database
      const team = await teams.create({
        name: name,
        slug: slug,
        ownerId: user.id,
      });

      // Initialize TeamDO and add creator as a member
      await useRpcTeamDO(ctx, team.id, async (rpc) => {
        rpc.setTeam(team);
        // Add team creator as a member
        await rpc.addTeamMember(user.id, user.tiltifyName);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Initialize UserDO and update user's team memberships
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        // Add team to user's memberships
        await rpc.addTeam({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        });
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      return team.id
    }
  }),
  /**
   * Updates an existing team's information.
   * Input: An object containing:
   *   - id (number) - The ID of the team to update
   *   - name (string) - The new name for the team
   *   - slug (string) - The new slug for the team URL
   * Action: Verifies the user is the team owner and updates the team information in the database and TeamDO.
   * Returns: The updated team object.
   */
  update: defineAction({
    input: z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      visible: z.boolean().optional(),
    }),
    handler: async ({id, name, slug, visible}, ctx) => {
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

      const teams = TeamRepo.action(ctx);

      // Check if team exists and user is the owner
      const team = await teams.findById(id);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can update teams
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can update teams'})
      }

      // Check if slug is available (if it's changed)
      if (slug !== team.slug) {
        const existingTeam = await teams.findBySlug(slug);
        if (existingTeam) {
          throw new ActionError({code: 'BAD_REQUEST', message: 'slug is already in use'})
        }
      }

      // Update team in database
      const updatedTeam = await teams.update(id, {
        name: name,
        slug: slug,
        ...(visible !== undefined && {visible}),
      });

      // Update TeamDO
      await useRpcTeamDO(ctx, id, async (rpc) => {
        await rpc.updateTeam({
          name: name,
          slug: slug,
          ...(visible !== undefined && {visible}),
        });
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      return updatedTeam
    }
  }),
  /**
   * Deletes a team owned by the authenticated user.
   * Input: teamId (number) - The ID of the team to delete
   * Action: Verifies the user is the team owner, deletes the team from the database, and updates all team members' UserDOs.
   * Returns: An object with a success flag.
   */
  deleteTeam: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const teams = TeamRepo.action(ctx);

      // Check if team exists and user is the owner
      const team = await teams.findById(teamId);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can delete teams
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can delete teams'})
      }

      // Get all team members from the database
      const members = await teams.getTeamMembers(teamId);
      const memberIds = members.map(member => member.userId);

      // Delete team in TeamDO
      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.deleteTeam();
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Update UserDO for each team member
      if (memberIds.length > 0) {
        for (const memberId of memberIds) {
          await useRpcUserDO(ctx, memberId, async (rpc) => {
            await rpc.teamDeleted(teamId);
          }, (error) => {
            throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
          });
        }
      }

      return {success: true}
    }
  }),
  /**
   * Allows a team member to leave a team.
   * Input: teamId (number) - The ID of the team to leave
   * Action: Verifies the user is not the team owner, removes them from the team in the database, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
  leaveTeam: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const teams = TeamRepo.action(ctx);

      // Check if team exists
      const team = await teams.findById(teamId);

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

      // Remove user from team in TeamDO
      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.userLeaveTeam(user.id);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Update UserDO state
      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.leaveTeam(teamId);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });
      return {success: true}
    }
  }),
  /**
   * Allows a team owner to remove a user from their team.
   * Input: An object containing:
   *   - userId (number) - The ID of the user to remove
   *   - teamId (number) - The ID of the team
   * Action: Verifies the authenticated user is the team owner, removes the specified user from the team, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
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

      const teams = TeamRepo.action(ctx);

      // Check if team exists and user is the owner
      const team = await teams.findById(teamId);

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

      // Remove user from team in TeamDO
      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.deleteTeamMember(user.id);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Update UserDO state
      await useRpcUserDO(ctx, userId, async (rpc) => {
        await rpc.removedFromTeam(teamId);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });
      return {success: true}
    }
  }),
  /**
   * Checks if a slug is valid and available for use with a team.
   * Input: An object containing:
   *   - slug (string) - The slug to validate
   *   - tiltifyName (string, optional) - The Tiltify username to generate alternative suggestions
   * Action: Validates if the provided slug is available for use and generates alternatives if not.
   * Returns: An object with isValid flag and an array of suggested alternatives if the slug is not valid.
   */
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

      // Note: We're still using generateTeamSlugAlternatives which uses direct DB access
      // This is because the function is in a separate file and modifying it is outside the scope
      // of the current migration task

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

  /**
   * Retrieves all teams a user is a member of given a tiltify username.
   * Input: tiltifyUsername (string) - The tiltify username to find teams for
   * Action: Uses the TeamRepo to find all teams the user is a member of.
   * Returns: An array of teams the user is a member of.
   */
  getTeamsByTiltifyUsername: defineAction({
    input: z.string(),
    handler: async (tiltifyUsername, ctx) => {
      try {
        const teamsRepo = TeamRepo.action(ctx);
        const teams = await teamsRepo.findVisibleByTiltifyUsername(tiltifyUsername);

        return {teams};
      } catch (e: any) {
        console.error('Error getting teams by tiltify username:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message});
      }
    }
  }),

  findVisible: defineAction({
    handler: (_, ctx) => {
      const repo = TeamRepo.action(ctx);
      return repo.findVisible()
    }
  }),

  findAllVisibleWithMemberCount: defineAction({
    handler: (_, ctx) => {
      const repo = TeamRepo.action(ctx);
      return repo.findAllVisibleWithMemberCount()
    }
  })
}

export const teamInvites = {
  /**
   * Invites a user to join a team.
   * Input: An object containing:
   *   - invitedUserId (number) - The ID of the user to invite
   *   - teamId (number) - The ID of the team
   * Action: Verifies the authenticated user is the team owner, creates an invitation in the database, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
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

      const teams = TeamRepo.action(ctx);
      const users = UserRepo.action(ctx);

      // Check if team exists and user is the owner
      const team = await teams.findById(teamId);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can invite people
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can invite users'})
      }

      console.log('invitedUserId', invitedUserId)

      const userToInvite = await users.getAccountByProvider(invitedUserId, 'tiltify')

      console.log('userToInvite', userToInvite)

      if (!userToInvite) {
        console.error('Error initializing UserToInvite:', 'user not found');
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: 'user not found'})
      }

      // Add invite to TeamDO
      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.addInvite(invitedUserId, userToInvite.providerUsername);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Add invite to UserDO
      await useRpcUserDO(ctx, invitedUserId, async (rpc) => {
        await rpc.addInvite({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        });
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });
      return {success: true}
    }
  }),
  /**
   * Removes an invitation to a team.
   * Input: An object containing:
   *   - invitedUserId (number) - The ID of the user whose invitation is being removed
   *   - teamId (number) - The ID of the team
   * Action: Verifies the authenticated user is the team owner, removes the invitation from the database, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
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

      const teams = TeamRepo.action(ctx);

      // Check if team exists and user is the owner
      const team = await teams.findById(teamId);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Ensure only team owners can remove invites
      if (team.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'Only team owners can remove invites'})
      }

      // Check if invite exists
      const hasInvite = await teams.hasInvite(teamId, invitedUserId);

      if (!hasInvite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      // Delete invite from TeamDO
      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.deleteInvite(invitedUserId);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });

      // Update UserDO state
      await useRpcUserDO(ctx, invitedUserId, async (rpc) => {
        await rpc.rejectInvite(teamId);
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      });
      return {success: true}
    }
  }),
  /**
   * Accepts an invitation to join a team.
   * Input: teamId (number) - The ID of the team whose invitation is being accepted
   * Action: Verifies the authenticated user has an invitation, adds them as a team member, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
  acceptInvite: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const teams = TeamRepo.action(ctx);

      // Check if team exists
      const team = await teams.findById(teamId);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Check if user has an invite
      const hasInvite = await teams.hasInvite(teamId, user.id);

      if (!hasInvite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.acceptInvite(user.id, user.tiltifyName)
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      })

      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.acceptInvite({
          id: team.id,
          name: team.name,
          slug: team.slug,
          ownerId: team.ownerId,
        })
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      })

      return {success: true}
    }
  }),
  /**
   * Rejects an invitation to join a team.
   * Input: teamId (number) - The ID of the team whose invitation is being rejected
   * Action: Verifies the authenticated user has an invitation, removes the invitation from the database, and updates both TeamDO and UserDO.
   * Returns: An object with a success flag.
   */
  rejectInvite: defineAction({
    input: z.number(),
    handler: async (teamId, ctx) => {
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const teams = TeamRepo.action(ctx);

      // Check if team exists
      const team = await teams.findById(teamId);

      if (!team) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Team not found'})
      }

      // Check if user has an invite
      const hasInvite = await teams.hasInvite(teamId, user.id);

      if (!hasInvite) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Invite not found'})
      }

      await useRpcTeamDO(ctx, teamId, async (rpc) => {
        await rpc.deleteInvite(user.id)
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      })

      await useRpcUserDO(ctx, user.id, async (rpc) => {
        await rpc.rejectInvite(teamId)
      }, (error) => {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: error.message});
      })

      return {success: true}
    }
  }),
}

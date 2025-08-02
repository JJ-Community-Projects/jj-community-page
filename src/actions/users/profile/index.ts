import {ActionError, defineAction} from "astro:actions";
import {handleUnauthorized} from "../../utils.ts";
import {UserTagServiceWithUser} from "../../../lib/db/services/users/tags/UserTagServiceWithUser.ts";
import {TiltifyRepo} from "../../../lib/db/repos/tiltify/TiltifyRepo.ts";
import {UserTiltifyServiceWithUser} from "../../../lib/db/services/users/tiltify/UserTiltifyServiceWithUser.ts";
import {UserRepo} from "../../../lib/db/repos/user/UserRepo.ts";

/**
 * Retrieves all tags associated with the authenticated user.
 * Input: None
 * Action: Queries the database for all tags belonging to the authenticated user.
 * Returns: An array of user tags.
 */
export const getUserTags = defineAction({
  handler: async (_, context) => {
    const {user} = handleUnauthorized(context);
    const userId = user.id;
    // Get user tags using UserTagRepo
    const userTags = UserTagServiceWithUser.action(context, userId)
    const tags = await userTags.findTags();
    return tags;
  }
});

/**
 * Retrieves the authenticated user's Tiltify account information.
 * Input: None
 * Action: Queries the database for the user's Tiltify account.
 * Returns: The user's Tiltify account information.
 */
export const getTiltifyAccount = defineAction({
  handler: async (_, context) => {
    const {user} = handleUnauthorized(context);
    const accounts = UserTiltifyServiceWithUser.action(context, user.id)
    // Query for Tiltify account using UserRepo
    const account = await accounts.getTiltifyAccount()


    if (!account) {
      throw new ActionError({code: 'NOT_FOUND'});
    }

    return account;
  }
});

export const findAllUsers = defineAction({
  handler: (_, context) => {
    const repo = UserRepo.action(context);
    return repo.fi();
  }
});

export const findAllTiltifyAccounts = defineAction({
  handler: (_, context) => {
    const repo = TiltifyRepo.action(context);
    return repo.getAllAccounts();
  }
});

export const isAdmin = defineAction({
  handler: async (_, context) => {
    const {user} = handleUnauthorized(context);

    const userRepo = UserRepo.action(context);
    const userId = user.id;

    const dbUser = await userRepo.findById(userId);
    console.log('users.isAdmin', 'dbUser', dbUser);
    if (!dbUser) {
      throw new ActionError({code: 'UNAUTHORIZED'});
    }

    return dbUser.role === 'admin';
  }
});

export const profile = {
  getUserTags,
  getTiltifyAccount,
  findAllUsers,
  findAllTiltifyAccounts,
  isAdmin
};

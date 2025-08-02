import {defineAction} from "astro:actions";
import {handleUnauthorized} from "../../utils.ts";
import {z} from "astro:content";
import {UserSearchService} from "../../../lib/db/services/users/search/UserSearchService.ts";

/**
 * Searches for users by username.
 * Input: searchTerm (string) - The term to search for in usernames
 * Action: Performs a fuzzy search on usernames in the database.
 * Returns: An array of matching user accounts.
 */
export const searchByUsername = defineAction({
  input: z.object({
    searchTerm: z.string(),
    includeSelf: z.boolean(),
  }),
  handler: async ({searchTerm, includeSelf}, context) => {
    const {user} = handleUnauthorized(context);

    console.log(`Searching ${searchTerm}`);

    // Perform search using UserRepo
    const users = UserSearchService.action(context)
    const foundAccounts = await users.searchByUsername(searchTerm, includeSelf, user.id, 5);
    return foundAccounts;
  }
});

export const search = {
  searchByUsername
};

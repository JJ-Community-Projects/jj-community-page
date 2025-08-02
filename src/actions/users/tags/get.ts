import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {UserTagServiceWithUser} from "../../../lib/db/services/users/tags/UserTagServiceWithUser.ts";
import {UserTagService} from "../../../lib/db/services/users/tags/UserTagService.ts";
import {getTags} from "../../../functions/getTags.ts";

/**
 * Retrieves suggested tags for a user that match a search term.
 * Input: An object containing:
 *   - userId (number) - The ID of the user
 *   - term (string) - The search term to match against tags
 *   - limit (number, default: 5) - The maximum number of suggested tags to return
 * Action: Finds tags that match the search term and aren't already used by the specified user.
 * Returns: An object containing matching tags from the database, default tags, and charity tags.
 */
export const getSuggestedTagsForUserBySearchTerm = defineAction({
  input: z.object({
    userId: z.number(),
    term: z.string(),
    limit: z.number().default(5),
  }),
  handler: async ({userId, term, limit}, context) => {
    try {
      // Get the search term in lowercase
      const searchTermLower = term.toLowerCase();

      const userTagService = UserTagServiceWithUser.action(context, userId);
      // Get user's existing tags to filter out from suggestions
      const userTagsList = await userTagService.findTags();
      // Extract user tags to filter default and charity tags
      const userTagValues = userTagsList.map(t => t.tag);
      // Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // Filter charity tags that match the search term and aren't already in the user's tags
      const filteredCharityTags = charityTags
        .filter(tag =>
          !userTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      if (term === '') {
        return {
          tags: [],
          defaultTags: [],
          charityTags: filteredCharityTags
        };
      }

      // Get matching tags based on search term
      const matchingTags = await userTagService.getSuggestedTagsBySearchTerm(term, limit);


      // Filter default tags that match the search term and aren't already in the user's tags
      const filteredDefaultTags = defaultTags
        .filter(tag =>
          !userTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));


      // If we still don't have enough tags, add more default tags that aren't in the user's tags
      // (regardless of whether they match the search term)
      let additionalDefaultTags: {
        label: string,
        tag: string
        count: number
      }[] = [];
      if (matchingTags.length + filteredDefaultTags.length + filteredCharityTags.length < limit) {
        additionalDefaultTags = defaultTags
          .filter(tag =>
            !userTagValues.includes(tag.tag) &&
            !tag.tag.includes(searchTermLower) // Only include tags that haven't been included yet
          )
          .map(tag => ({
            ...tag,
            count: 0
          }))
          .slice(0, limit - (matchingTags.length + filteredDefaultTags.length + filteredCharityTags.length));
      }

      // Combine all filtered default tags
      const allFilteredDefaultTags = [...filteredDefaultTags, ...additionalDefaultTags];

      return {
        tags: matchingTags,
        defaultTags: allFilteredDefaultTags,
        charityTags: filteredCharityTags
      };
    } catch (error) {
      console.error('Error retrieving suggested tags by search term:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve suggested tags'
      });
    }
  }
});

/**
 * Retrieves the most popular user tags.
 * Input: limit (number, default: 5) - The maximum number of popular tags to return
 * Action: Queries the database for the most frequently used user tags and supplements with default tags if needed.
 * Returns: An object containing popular tags, default tags, and charity tags with their usage counts.
 */
export const getPopularTags = defineAction({
  input: z.number().default(5),
  handler: async (limit, context) => {
    try {
      const userTagService = new UserTagService(context.locals.runtime.env, 'action');
      const popularTags = await userTagService.findPopularTags(limit);

      // If there are not enough tags found, supplement with tags from getTags function
      if (popularTags.length < limit) {
        // Get default tags and charity tags
        const {tags: defaultTags, charityTags} = getTags();

        // Convert default tags to the same format as database tags
        const formattedDefaultTags = defaultTags.map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

        // Convert charity tags to the same format as database tags
        const formattedCharityTags = charityTags.map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

        // Filter out default tags that are already in the popular tags
        const existingTags = popularTags.map(t => t.tag);
        const filteredDefaultTags = formattedDefaultTags.filter(tag => !existingTags.includes(tag.tag));

        // Add enough default tags to reach the limit
        const additionalTags = filteredDefaultTags.slice(0, limit - popularTags.length);

        // Return combined results
        return {
          tags: popularTags,
          defaultTags: additionalTags,
          charityTags: formattedCharityTags
        };
      }

      // If we have enough popular tags, just return them
      return {
        tags: popularTags,
        defaultTags: [],
        charityTags: []
      };
    } catch (error) {
      console.error('Error retrieving popular tags:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve popular tags'
      });
    }
  }
});

/**
 * Retrieves suggested tags for a specific user.
 * Input: An object containing:
 *   - userId (number) - The ID of the user
 *   - limit (number, default: 5) - The maximum number of suggested tags to return
 * Action: Finds popular tags that aren't already used by the specified user.
 * Returns: An object containing suggested tags, default tags, and charity tags that aren't already used by the user.
 */
export const getSuggestedTagsForUser = defineAction({
  input: z.object({
    userId: z.number(),
    limit: z.number().default(5),
  }),
  handler: async ({userId, limit}, context) => {
    try {
      const userTagService = UserTagServiceWithUser.action(context, userId);
      // Get suggested tags for the user
      const popularTags = await userTagService.getSuggestedTags(limit);

      // Get user's existing tags to filter out from suggestions
      const userTagsList = await userTagService.findTags();

      // Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // Extract user tags to filter default and charity tags
      const userTagValues = userTagsList.map(t => t.tag);

      // Filter charity tags that aren't already part of the user's tags
      const filteredCharityTags = charityTags
        .filter(tag => !userTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      // Filter default tags that aren't already part of the user's tags
      const filteredDefaultTags = defaultTags
        .filter(tag => !userTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      return {
        tags: popularTags,
        defaultTags: filteredDefaultTags,
        charityTags: filteredCharityTags
      };
    } catch (error) {
      console.error('Error retrieving suggested tags:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve suggested tags'
      });
    }
  }
});

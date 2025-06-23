import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {getTags} from "../functions/getTags.ts";
import {socialUrlRegex} from "../functions/socialUrlRegex.ts";
import {getTiltifyTokenFromContext, getTiltifyUser} from "../functions/tiltify.ts";
import {UserRepo} from "../lib/db/repos/UserRepo.ts";
import {getUserDO} from "./getDO.ts";

export const users = {
  /**
   * Updates the user's style preferences.
   * Input: An object containing:
   *   - primaryColor (string) - The primary color in hex format
   *   - accentColor (string) - The accent color in hex format
   * Action: Updates the user's style preferences in the database and UserDO.
   * Returns: An object with a success flag.
   */
  updateUserStyle: defineAction({
    input: z.object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
        message: "Primary color must be a valid hex color code (e.g., #E30E50)"
      }),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
        message: "Accent color must be a valid hex color code (e.g., #3584BF)"
      })
    }),
    handler: async ({primaryColor, accentColor}, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Update user style
      try {
        let result;
        try {
          result = await stub.updateUserStyle(primaryColor, accentColor);
          console.log('User style updated successfully');
        } catch (error) {
          console.error('Error in stub.updateUserStyle operation:', error);
          throw error;
        }

        if (!result) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user style'
          });
        }
        return {success: true};
      } catch (error) {
        console.error('Error updating user style:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user style'
        });
      }
    }
  }),
  /**
   * Fetches social media links from the user's Tiltify account and adds them to their profile.
   * Input: None
   * Action: Retrieves the user's Tiltify token, fetches their social media links from Tiltify, and adds them to the UserDO.
   * Returns: An object with success status and results for each social media platform.
   */
  fetchSocialsFromTiltify: defineAction({
    handler: async (_, context) => {
      // 1. Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // 2. Get the user's Tiltify token
      let tiltifyToken;
      try {
        tiltifyToken = await getTiltifyTokenFromContext(context);
        if (!tiltifyToken) {
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'No Tiltify token found for user'
          });
        }
      } catch (error) {
        console.error('Error getting Tiltify token:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Tiltify token'
        });
      }

      // 3. Get the Tiltify user data
      let tiltifyUser;
      try {
        tiltifyUser = await getTiltifyUser(tiltifyToken);
        if (!tiltifyUser) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get Tiltify user data'
          });
        }
      } catch (error) {
        console.error('Error getting Tiltify user data:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Tiltify user data'
        });
      }

      // 4. Set the user socials using the Tiltify data
      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Add socials from Tiltify data
      const socials = tiltifyUser.data.social;
      const results = [];

      try {
        // Add Twitch social if available
        if (socials.twitch) {
          const twitchUrl = socials.twitch.startsWith('http')
            ? socials.twitch
            : `https://twitch.tv/${socials.twitch}`;

          try {
            const result = await stub.addSocial('twitch', twitchUrl);
            results.push({provider: 'twitch', success: !!result});
          } catch (error) {
            console.error('Error adding Twitch social:', error);
            results.push({provider: 'twitch', success: false});
          }
        }

        // Add Twitter social if available
        if (socials.twitter) {
          const twitterUrl = socials.twitter.startsWith('http')
            ? socials.twitter
            : `https://twitter.com/${socials.twitter}`;

          try {
            const result = await stub.addSocial('twitter', twitterUrl);
            results.push({provider: 'twitter', success: !!result});
          } catch (error) {
            console.error('Error adding Twitter social:', error);
            results.push({provider: 'twitter', success: false});
          }
        }

        // Add YouTube social if available
        if (socials.youtube) {
          let youtubeUrl = socials.youtube;
          if (!youtubeUrl.startsWith('http')) {
            // Check if it's a channel ID or username
            if (youtubeUrl.startsWith('UC')) {
              youtubeUrl = `https://youtube.com/channel/${youtubeUrl}`;
            } else {
              youtubeUrl = `https://youtube.com/@${youtubeUrl}`;
            }
          }

          try {
            const result = await stub.addSocial('youtube', youtubeUrl);
            results.push({provider: 'youtube', success: !!result});
          } catch (error) {
            console.error('Error adding YouTube social:', error);
            results.push({provider: 'youtube', success: false});
          }
        }

        // Add Instagram social if available
        if (socials.instagram) {
          const instagramUrl = socials.instagram.startsWith('http')
            ? socials.instagram
            : `https://instagram.com/${socials.instagram}`;

          try {
            const result = await stub.addSocial('instagram', instagramUrl);
            results.push({provider: 'instagram', success: !!result});
          } catch (error) {
            console.error('Error adding Instagram social:', error);
            results.push({provider: 'instagram', success: false});
          }
        }

        // Add TikTok social if available
        if (socials.tiktok) {
          const tiktokUrl = socials.tiktok.startsWith('http')
            ? socials.tiktok
            : `https://tiktok.com/@${socials.tiktok}`;

          try {
            const result = await stub.addSocial('tiktok', tiktokUrl);
            results.push({provider: 'tiktok', success: !!result});
          } catch (error) {
            console.error('Error adding TikTok social:', error);
            results.push({provider: 'tiktok', success: false});
          }
        }

        return {
          success: true,
          results
        };
      } catch (error) {
        console.error('Error setting user socials:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set user socials'
        });
      }
    }
  }),

  /**
   * Adds a social media link to the user's profile.
   * Input: An object containing:
   *   - provider (string) - The social media platform (twitch, twitter, bsky, youtube, instagram, tiktok)
   *   - url (string) - The URL of the user's social media profile
   * Action: Validates the URL format and adds the social media link to the UserDO.
   * Returns: An object with a success flag.
   */
  addSocial: defineAction({
    input: z.object({
      provider: z.string().refine(val => ['twitch', 'twitter', 'bsky', 'youtube', 'instagram', 'tiktok'].includes(val.toLowerCase()), {
        message: "Provider must be one of: twitch, twitter, bsky, youtube, instagram, tiktok"
      }),
      url: z.string()
    })
      .refine(
        (data) => {
          const regexes = socialUrlRegex();
          const provider = data.provider.toLowerCase();
          const url = data.url;

          if (provider === 'twitch') {
            return regexes.twitch.test(url);
          } else if (provider === 'twitter') {
            return regexes.twitter.test(url);
          } else if (provider === 'bsky') {
            return regexes.bsky.test(url);
          } else if (provider === 'youtube') {
            return regexes.youtube.test(url);
          } else if (provider === 'instagram') {
            return regexes.instagram.test(url);
          } else if (provider === 'tiktok') {
            return regexes.tiktok.test(url);
          }
          return false;
        },
        (data) => {
          const provider = data.provider.toLowerCase();
          let message = "Please enter a valid URL";

          if (provider === 'twitch') {
            message = "Please enter a valid Twitch URL (e.g., https://twitch.tv/username)";
          } else if (provider === 'twitter') {
            message = "Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)";
          } else if (provider === 'bsky') {
            message = "Please enter a valid Bluesky URL (e.g., https://bsky.app/profile/user@domain.com)";
          } else if (provider === 'youtube') {
            message = "Please enter a valid YouTube URL (e.g., https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID)";
          } else if (provider === 'instagram') {
            message = "Please enter a valid Instagram URL (e.g., https://instagram.com/username)";
          } else if (provider === 'tiktok') {
            message = "Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)";
          }

          return {
            message,
            path: ["url"] // This ensures the error is associated with the url field
          };
        }
      ),
    handler: async ({provider, url}, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Add social
      try {
        let result;
        try {
          result = await stub.addSocial(provider.toLowerCase(), url);
          console.log('Social added successfully:', provider);
        } catch (error) {
          console.error('Error in stub.addSocial operation:', error);
          throw error;
        }

        if (!result) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add social media link'
          });
        }
        return {success: true};
      } catch (error) {
        console.error('Error adding social:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add social media link'
        });
      }
    }
  }),

  /**
   * Removes a social media link from the user's profile.
   * Input: An object containing:
   *   - provider (string) - The social media platform to remove (twitch, twitter, bsky, youtube, instagram, tiktok)
   * Action: Removes the specified social media link from the UserDO.
   * Returns: An object with a success flag.
   */
  removeSocial: defineAction({
    input: z.object({
      provider: z.string().refine(val => ['twitch', 'twitter', 'bsky', 'youtube', 'instagram', 'tiktok'].includes(val.toLowerCase()), {
        message: "Provider must be one of: twitch, twitter, bsky, youtube, instagram, tiktok"
      })
    }),
    handler: async ({provider}, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Remove social
      try {
        let result;
        try {
          result = await stub.removeSocial(provider.toLowerCase());
          console.log('Social removed successfully:', provider);
        } catch (error) {
          console.error('Error in stub.removeSocial operation:', error);
          throw error;
        }

        if (!result) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove social media link'
          });
        }
        return {success: true};
      } catch (error) {
        console.error('Error removing social:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove social media link'
        });
      }
    }
  }),
  /**
   * Adds a tag to the user's profile.
   * Input: An object containing:
   *   - tag (string) - The tag to add
   *   - label (string, optional) - The display label for the tag
   * Action: Adds the specified tag to the UserDO.
   * Returns: An object with a success flag.
   */
  addTag: defineAction({
    input: z.object({
      tag: z.string(),
      label: z.string().optional()
    }),
    handler: async ({tag, label}, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Add tag
      try {
        let result;
        try {
          result = await stub.addTag(tag, label || tag);
          console.log('Tag added successfully:', tag);
        } catch (error) {
          console.error('Error in stub.addTag operation:', error);
          throw error;
        }

        if (!result) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add tag'
          });
        }
        return {success: true};
      } catch (error) {
        console.error('Error adding tag:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add tag'
        });
      }
    }
  }),

  /**
   * Removes a tag from the user's profile.
   * Input: An object containing:
   *   - tag (string) - The tag to remove
   * Action: Removes the specified tag from the UserDO.
   * Returns: An object with a success flag.
   */
  removeTag: defineAction({
    input: z.object({
      tag: z.string()
    }),
    handler: async ({tag}, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Remove tag
      try {
        let result;
        try {
          result = await stub.removeTag(tag);
          console.log('Tag removed successfully:', tag);
        } catch (error) {
          console.error('Error in stub.removeTag operation:', error);
          throw error;
        }

        if (!result) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove tag'
          });
        }
        return {success: true};
      } catch (error) {
        console.error('Error removing tag:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove tag'
        });
      }
    }
  }),

  /**
   * Retrieves all tags associated with the authenticated user.
   * Input: None
   * Action: Queries the database for all tags belonging to the authenticated user.
   * Returns: An array of user tags.
   */
  getUserTags: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get user tags using UserRepo
      const users = UserRepo.action(context);
      const tags = await users.getUserTags(user.id);
      return tags;
    }
  }),

  /**
   * Refreshes the user's Durable Object by reloading schedules from the database.
   * Input: None
   * Action: Loads the user's schedules into their UserDO from the database.
   * Returns: A string indicating completion.
   */
  refreshDO: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      // Load user schedules
      try {
        await stub.loadUserSchedules();
      } catch (error) {
        console.error('Error loading user schedules:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load user schedules'
        });
      }

      return 'done';
    }
  }),

  /**
   * Searches for users by username.
   * Input: searchTerm (string) - The term to search for in usernames
   * Action: Performs a fuzzy search on usernames in the database.
   * Returns: An array of matching user accounts.
   */
  search: defineAction({
    input: z.string(),
    handler: async (searchTerm, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      console.log(`Searching ${searchTerm}`);

      // Perform search using UserRepo
      const users = UserRepo.action(context);
      const foundAccounts = await users.searchUser(searchTerm, user.id, 5);
      return foundAccounts;
    }
  }),

  /**
   * Retrieves the authenticated user's Tiltify account information.
   * Input: None
   * Action: Queries the database for the user's Tiltify account.
   * Returns: The user's Tiltify account information.
   */
  getTiltifyAccount: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Query for Tiltify account using UserRepo
      const users = UserRepo.action(context);
      const accounts = await users.getAccounts(user.id);
      return accounts.find(account => account.provider === 'tiltify');
    }
  }),

  /**
   * Retrieves the tables data from the authenticated user's UserDO.
   * Input: None
   * Action: Gets the tables data from the UserDO for the authenticated user.
   * Returns: The tables data from the UserDO.
   */
  getTables: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      const userId = user.id;
      const stub = getUserDO(context, userId);

      console.log('getting table data')
      try {
        return await stub.getTables()
      } catch (e: any) {
        console.error('Error getting tables from UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }
    }
  }),

  /**
   * Retrieves the most popular user tags.
   * Input: limit (number, default: 5) - The maximum number of popular tags to return
   * Action: Queries the database for the most frequently used user tags and supplements with default tags if needed.
   * Returns: An object containing popular tags, default tags, and charity tags with their usage counts.
   */
  getPopularTags: defineAction({
    input: z.number().default(5),
    handler: async (limit, context) => {
      try {
        const users = UserRepo.action(context);
        const popularTags = await users.getPopularTags(limit);

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
  }),

  /**
   * Retrieves suggested tags for a specific user.
   * Input: An object containing:
   *   - userId (number) - The ID of the user
   *   - limit (number, default: 5) - The maximum number of suggested tags to return
   * Action: Finds popular tags that aren't already used by the specified user.
   * Returns: An object containing suggested tags, default tags, and charity tags that aren't already used by the user.
   */
  getSuggestedTagsForUser: defineAction({
    input: z.object({
      userId: z.number(),
      limit: z.number().default(5),
    }),
    handler: async ({userId, limit}, context) => {
      try {
        const users = UserRepo.action(context);
        // Get user's existing tags to filter out from suggestions
        const userTagsList = await users.getUserTags(userId);
        // Get suggested tags for the user
        const popularTags = await users.getSuggestedTagsForUser(userId, limit);

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
  }),

  /**
   * Retrieves suggested tags for a user that match a search term.
   * Input: An object containing:
   *   - userId (number) - The ID of the user
   *   - term (string) - The search term to match against tags
   *   - limit (number, default: 5) - The maximum number of suggested tags to return
   * Action: Finds tags that match the search term and aren't already used by the specified user.
   * Returns: An object containing matching tags from the database, default tags, and charity tags.
   */
  getSuggestedTagsForUserBySearchTerm: defineAction({
    input: z.object({
      userId: z.number(),
      term: z.string(),
      limit: z.number().default(5),
    }),
    handler: async ({userId, term, limit}, context) => {
      try {
        const users = UserRepo.action(context);
        // Get user's existing tags to filter out from suggestions
        const userTagsList = await users.getUserTags(userId);
        // Get matching tags based on search term
        const matchingTags = await users.getSuggestedTagsForUserBySearchTerm(userId, term, limit);

        // Get the default tags from the getTags function
        const {tags: defaultTags, charityTags} = getTags();

        // Extract user tags to filter default and charity tags
        const userTagValues = userTagsList.map(t => t.tag);

        // Get the search term in lowercase
        const searchTermLower = term.toLowerCase();

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
  }),

  /**
   * Retrieves user data, tiltify account data, user socials, and user tags for a given tiltify username.
   * Input: tiltifyUserName (string) - The tiltify username to look up
   * Action: Queries the database for user, account, socials, and tags information associated with the tiltify username.
   * Returns: An object containing user data, tiltify account data, user socials, and user tags, or null if not found.
   */
  getUserByTiltifyUsername: defineAction({
    input: z.string(),
    handler: async (providerUsername, context) => {
      try {
        // Create UserRepo instance
        const userRepo = UserRepo.action(context);

        // Call the getUserByTiltifyUsername method
        const tiltifyUser = await userRepo.getUserByTiltifyUsername(providerUsername);

        if (!tiltifyUser) {
          return null;
        }

        return tiltifyUser;
      } catch (error) {
        console.error('Error getting user by Tiltify username:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user data by Tiltify username'
        });
      }
    }
  }),

  /**
   * Checks if a tiltify account is blocked.
   * Input: tiltifyUserName (string) - The tiltify username to check
   * Action: Queries the database to determine if the tiltify account is in the blockedAccounts table.
   * Returns: A boolean indicating if the account is blocked.
   */
  isTiltifyAccountBlocked: defineAction({
    input: z.string(),
    handler: async (providerUsername, context) => {
      try {
        // Create UserRepo instance
        const userRepo = UserRepo.action(context);

        // Call the isTiltifyAccountBlocked method
        const isBlocked = await userRepo.isTiltifyAccountBlocked(providerUsername);

        return isBlocked;
      } catch (error) {
        console.error('Error checking if Tiltify account is blocked:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check if Tiltify account is blocked'
        });
      }
    }
  }),


  findAllUsers: defineAction({
    handler: (_, context) => {
      const repo = UserRepo.action(context);
      return repo.findAll();
    }
  }),
  findAllTiltifyAccounts: defineAction({
    handler: (_, context) => {
      const repo = UserRepo.action(context);
      return repo.findAllTiltifyAccounts();
    }
  })
}

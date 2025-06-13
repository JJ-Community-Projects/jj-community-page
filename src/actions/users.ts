import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {getDB} from "../lib/db/db.ts";
import {accounts, userTags} from "../lib/db/schema/auth-schema.ts";
import {and, desc, eq, like, not, notInArray, sql} from "drizzle-orm";
import {getTags} from "../functions/getTags.ts";
import {socialUrlRegex} from "../functions/socialUrlRegex.ts";
import {getTiltifyTokenFromContext, getTiltifyUser} from "../functions/tiltify.ts";

export const users = {
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
      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(`${userId}`);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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
            results.push({ provider: 'twitch', success: !!result });
          } catch (error) {
            console.error('Error adding Twitch social:', error);
            results.push({ provider: 'twitch', success: false });
          }
        }

        // Add Twitter social if available
        if (socials.twitter) {
          const twitterUrl = socials.twitter.startsWith('http')
            ? socials.twitter
            : `https://twitter.com/${socials.twitter}`;

          try {
            const result = await stub.addSocial('twitter', twitterUrl);
            results.push({ provider: 'twitter', success: !!result });
          } catch (error) {
            console.error('Error adding Twitter social:', error);
            results.push({ provider: 'twitter', success: false });
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
            results.push({ provider: 'youtube', success: !!result });
          } catch (error) {
            console.error('Error adding YouTube social:', error);
            results.push({ provider: 'youtube', success: false });
          }
        }

        // Add Instagram social if available
        if (socials.instagram) {
          const instagramUrl = socials.instagram.startsWith('http')
            ? socials.instagram
            : `https://instagram.com/${socials.instagram}`;

          try {
            const result = await stub.addSocial('instagram', instagramUrl);
            results.push({ provider: 'instagram', success: !!result });
          } catch (error) {
            console.error('Error adding Instagram social:', error);
            results.push({ provider: 'instagram', success: false });
          }
        }

        // Add TikTok social if available
        if (socials.tiktok) {
          const tiktokUrl = socials.tiktok.startsWith('http')
            ? socials.tiktok
            : `https://tiktok.com/@${socials.tiktok}`;

          try {
            const result = await stub.addSocial('tiktok', tiktokUrl);
            results.push({ provider: 'tiktok', success: !!result });
          } catch (error) {
            console.error('Error adding TikTok social:', error);
            results.push({ provider: 'tiktok', success: false });
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

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(`${userId}`);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(`${userId}`);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(`${userId}`);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(userId);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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

  getUserTags: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get database instance
      let db;
      try {
        db = getDB(context);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // Get user tags
      try {
        const tags = await db.select()
          .from(userTags)
          .where(eq(userTags.userId, user.id))
          .all();
        return tags;
      } catch (error) {
        console.error('Error getting user tags:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user tags'
        });
      }
    }
  }),

  refreshDO: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;

      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(userId);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }

      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }

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

  search: defineAction({
    input: z.string(),
    handler: async (searchTerm, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get database instance
      let db;
      try {
        db = getDB(context);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // Create search pattern for fuzzy search
      const searchPattern = `%${searchTerm}%`;
      console.log(`Searching ${searchTerm}, ${searchPattern}`);

      // Perform fuzzy search on multiple fields
      let foundAccounts;
      try {
        foundAccounts = await db.select({
          userId: accounts.userId,
          provider: accounts.provider,
          providerName: accounts.providerUsername
        })
          .from(accounts)
          .where(
            and(
              like(accounts.providerUsername, searchPattern),
              not(
                eq(accounts.userId, user.id)
              )
            )
          )
          .limit(5)
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search for accounts in the database'
        });
      }

      // Return the results
      return foundAccounts;
    }
  }),

  getTiltifyAccount: defineAction({
    handler: async (_, context) => {
      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get database instance
      let db;
      try {
        db = getDB(context);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // Query for Tiltify account
      try {
        return await db.select()
          .from(accounts)
          .where(and(eq(accounts.userId, user.id), eq(accounts.provider, 'tiltify')))
          .get();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve Tiltify account information'
        });
      }
    }
  }),

  getTables: defineAction({
    handler: async (_, context) => {

      // Check if user is authenticated
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get Durable Object reference
      let DO;
      try {
        DO = context.locals.runtime.env.UserDO;
      } catch (error) {
        console.error('Error accessing UserDO:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data object'
        });
      }
      if (!DO) {
        throw new Error('UserDO not available');
      }

      const userId = user.id;
      // Create Durable Object ID
      let id;
      try {
        id = DO.idFromName(userId);
      } catch (error) {
        console.error('Error creating DO ID:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user identifier'
        });
      }
      // Get Durable Object stub
      let stub;
      try {
        stub = DO.get(id);
      } catch (error) {
        console.error('Error getting DO stub:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to access user data'
        });
      }
      console.log('getting table data')
      return stub.getTables()
    }
  }),

  getPopularTags: defineAction({
    input: z.number().default(5),
    handler: async (limit, ctx) => {
      // Get database instance
      let db;
      try {
        db = getDB(ctx);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // 1. Get all tags from the database, ordered by count
      let popularTags;
      try {
        popularTags = await db
          .select({
            tag: userTags.tag,
            label: userTags.label,
            count: sql<number>`count(
            ${userTags.tag}
            )`.as('count')
          })
          .from(userTags)
          .groupBy(userTags.tag)
          .orderBy((s) => {
            return desc(s.count)
          })
          .limit(limit)
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve popular tags from the database'
        });
      }

      // 2. If there are not enough tags found, supplement with tags from getTags function
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
    }
  }),

  getSuggestedTagsForUser: defineAction({
    input: z.object({
      userId: z.number(),
      limit: z.number().default(5),
    }),
    handler: async ({userId, limit}, ctx) => {
      // Get database instance
      let db;
      try {
        db = getDB(ctx);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // 1. Search all tags of the user
      let userTagsList;
      try {
        userTagsList = await db
          .select({
            tag: userTags.tag,
          })
          .from(userTags)
          .where(eq(userTags.userId, userId))
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user tags from the database'
        });
      }

      const userTagValues = userTagsList.map(t => t.tag);

      // 2. Find the most used tags that aren't part of the user's tags
      let popularTags;
      try {
        popularTags = await db
          .select({
            tag: userTags.tag,
            label: userTags.label,
            count: sql<number>`count(
            ${userTags.tag}
            )`.as('count')
          })
          .from(userTags)
          .where(
            and(
              // Exclude tags that are already part of the user's tags
              notInArray(userTags.tag, userTagValues)
            )
          )
          .groupBy(userTags.tag)
          .orderBy((s) => {
            return desc(s.count)
          })
          .limit(limit)
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve popular tags from the database'
        });
      }

      // 3. Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // 4. Return an object with charityTags and tags, excluding tags already part of the user's tags
      const filteredCharityTags = charityTags
        .filter(tag => !userTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

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
    }
  }),

  getSuggestedTagsForUserBySearchTerm: defineAction({
    input: z.object({
      userId: z.number(),
      term: z.string(),
      limit: z.number().default(5),
    }),
    handler: async ({userId, term, limit}, ctx) => {
      // Get database instance
      let db;
      try {
        db = getDB(ctx);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // 1. Search all tags of the user
      let userTagsList;
      try {
        userTagsList = await db
          .select({
            tag: userTags.tag,
          })
          .from(userTags)
          .where(eq(userTags.userId, userId))
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user tags from the database'
        });
      }

      const userTagValues = userTagsList.map(t => t.tag);

      // 2. Find the most used tags that aren't part of the user's tags and match the search term
      let databaseTags;
      try {
        databaseTags = await db
          .select({
            tag: userTags.tag,
            label: userTags.label,
            count: sql<number>`count(
            ${userTags.tag}
            )`.as('count')
          })
          .from(userTags)
          .where(
            and(
              // Exclude tags that are already part of the user's tags
              notInArray(userTags.tag, userTagValues),
              like(userTags.tag, `%${term.toLowerCase()}%`)
            )
          )
          .groupBy(userTags.tag)
          .orderBy((s) => {
            return desc(s.count)
          })
          .limit(limit)
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve matching tags from the database'
        });
      }

      // 3. Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // 4. If we don't have enough tags from the database, supplement with default tags
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

      // 5. If we still don't have enough tags, add more default tags that aren't in the user's tags
      // (regardless of whether they match the search term)
      let additionalDefaultTags: {
        label: string,
        tag: string
        count: number
      }[] = [];
      if (databaseTags.length + filteredDefaultTags.length + filteredCharityTags.length < limit) {
        additionalDefaultTags = defaultTags
          .filter(tag =>
            !userTagValues.includes(tag.tag) &&
            !tag.tag.includes(searchTermLower) // Only include tags that haven't been included yet
          )
          .map(tag => ({
            ...tag,
            count: 0
          }))
          .slice(0, limit - (databaseTags.length + filteredDefaultTags.length + filteredCharityTags.length));
      }

      // Combine all filtered default tags
      const allFilteredDefaultTags = [...filteredDefaultTags, ...additionalDefaultTags];

      return {
        tags: databaseTags,
        defaultTags: allFilteredDefaultTags,
        charityTags: filteredCharityTags
      };
    }
  }),
}

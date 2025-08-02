import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {TwitchWebService} from "../lib/externalAPI/TwitchWebService.ts";
import {UserTwitchService} from "../lib/db/services/users/twitch/UserTwitchService.ts";
import {UserTwitchServiceWithUser} from "../lib/db/services/users/twitch/UserTwitchServiceWithUser.ts";


export const twitch = {
  validatedTwitchUrl: defineAction({
    input: z.string().url(),
    handler: async (url, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }
      const userId = user.id;

      // Use the TwitchAPIService instead of directly accessing the Durable Object
      const twitchAPIService = TwitchWebService.action(context);

      const components = url.split('/')
      const name = components[components.length - 1];

      const {data, error} = await twitchAPIService.fetchUserByLogin(name);

      if (error) {
        throw new ActionError({code: 'BAD_REQUEST', message: error.description});
      }
      if(data.data.length === 0){
        throw new ActionError({code: 'NOT_FOUND'});
      }

      return data.data[0]
    }
  }),

  // Get the current user's Twitch channel
  getUserTwitchChannel: defineAction({
    handler: async (_, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Use the UserTwitchServiceWithUser to get the channel for the current user
      const userTwitchService = UserTwitchServiceWithUser.action(context, user.id);
      const channel = await userTwitchService.getTwitchChannel();

      if (!channel) {
        return null; // No channel found, but not an error
      }

      return channel;
    }
  }),

  // Create a Twitch channel for the current user
  createUserTwitchChannel: defineAction({
    input: z.object({
      id: z.string(),
      login: z.string(),
      displayName: z.string(),
      profileImageUrl: z.string().optional(),
      offlineImageUrl: z.string().optional(),
      description: z.string().optional()
    }),
    handler: async (data, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Use the UserTwitchServiceWithUser to create a channel for the current user
      const userTwitchService = UserTwitchServiceWithUser.action(context, user.id);

      try {
        const channel = await userTwitchService.createTwitchChannel(data, user.id);
        return channel;
      } catch (error) {
        if (error instanceof Error) {
          throw new ActionError({code: 'BAD_REQUEST', message: error.message});
        }
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR'});
      }
    }
  }),

  // Update a Twitch channel
  updateUserTwitchChannel: defineAction({
    input: z.object({
      channelId: z.string(),
      data: z.object({
        displayName: z.string().optional(),
        profileImageUrl: z.string().optional(),
        offlineImageUrl: z.string().optional(),
        description: z.string().optional()
      })
    }),
    handler: async ({channelId, data}, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Use the UserTwitchService to update the channel
      const userTwitchService = UserTwitchService.action(context);

      try {
        const channel = await userTwitchService.updateTwitchChannel(channelId, data, user.id);
        return channel;
      } catch (error) {
        if (error instanceof Error) {
          throw new ActionError({code: 'BAD_REQUEST', message: error.message});
        }
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR'});
      }
    }
  }),

  // Delete a Twitch channel
  deleteUserTwitchChannel: defineAction({
    input: z.object({
      channelId: z.string()
    }),
    handler: async ({channelId}, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Use the UserTwitchService to delete the channel
      const userTwitchService = UserTwitchService.action(context);

      try {
        await userTwitchService.deleteTwitchChannel(channelId, user.id);
        return { success: true };
      } catch (error) {
        if (error instanceof Error) {
          throw new ActionError({code: 'BAD_REQUEST', message: error.message});
        }
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR'});
      }
    }
  }),

  // Fetch Twitch stream data for a user
  getTwitchStream: defineAction({
    input: z.object({
      twitchUserId: z.string()
    }),
    handler: async ({twitchUserId}, context) => {
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Use the TwitchAPIService to fetch stream data
      const twitchAPIService = TwitchWebService.action(context);

      const {data, error} = await twitchAPIService.fetchStreamsByUserId(twitchUserId);

      if (error) {
        throw new ActionError({code: 'BAD_REQUEST', message: error.description});
      }

      return data;
    }
  })
}

import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {handleUnauthorized} from "../../utils.ts";
import {socialUrlRegex} from "../../../functions/socialUrlRegex.ts";
import {UserSocialsServiceWithUser} from "../../../lib/db/services/users/socials/UserSocialsServiceWithUser.ts";
import {UserServiceWithUser} from "../../../lib/db/services/users/UserServiceWithUser.ts";

/**
 * Adds a social media link to the user's profile.
 * Input: An object containing:
 *   - provider (string) - The social media platform (twitch, twitter, bsky, youtube, instagram, tiktok)
 *   - url (string) - The URL of the user's social media profile
 * Action: Validates the URL format and adds the social media link to the UserDO.
 * Returns: An object with a success flag.
 */
export const addSocial = defineAction({
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
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserSocialsServiceWithUser
    const socialsService = UserSocialsServiceWithUser.action(context, userId);
    try {
      await socialsService.addSocial({
        provider: provider.toLowerCase(),
        url
      }, userId);
      return {success: true};
    } catch (error) {
      console.error('Error adding social media link:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add social media link'
      });
    }
  }
});

/**
 * Removes a social media link from the user's profile.
 * Input: An object containing:
 *   - provider (string) - The social media platform to remove (twitch, twitter, bsky, youtube, instagram, tiktok)
 * Action: Removes the specified social media link from the UserDO.
 * Returns: An object with a success flag.
 */
export const removeSocial = defineAction({
  input: z.object({
    provider: z.string().refine(val => ['twitch', 'twitter', 'bsky', 'youtube', 'instagram', 'tiktok'].includes(val.toLowerCase()), {
      message: "Provider must be one of: twitch, twitter, bsky, youtube, instagram, tiktok"
    })
  }),
  handler: async ({provider}, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserSocialsServiceWithUser
    const socialsService = UserSocialsServiceWithUser.action(context, userId);
    try {
      await socialsService.removeSocial(provider.toLowerCase(), userId);
      return {success: true};
    } catch (error) {
      console.error('Error removing social media link:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove social media link'
      });
    }
  }
});

/**
 * Sets the user's primary live streaming platform.
 * Input: An object containing:
 *   - platform (string) - The platform to set as primary (twitch, youtube, tiktok)
 * Action: Updates the user's primaryLiveStream setting in the database and UserDO.
 * Returns: An object with a success flag.
 */
export const setPrimaryLiveStream = defineAction({
  input: z.object({
    platform: z.string().refine(val => ['twitch', 'youtube', 'tiktok'].includes(val.toLowerCase()), {
      message: "Platform must be one of: twitch, youtube, tiktok"
    })
  }),
  handler: async ({platform}, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    // Use UserServiceWithUser
    const userService = UserServiceWithUser.action(context, userId);
    try {
      await userService.updatePrimaryLiveStream(platform.toLowerCase(), userId);
      return {success: true};
    } catch (error) {
      console.error('Error setting primary live stream platform:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to set primary live stream platform'
      });
    }
  }
});

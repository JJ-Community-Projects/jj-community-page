import {ActionError, defineAction} from "astro:actions";
import {handleUnauthorized} from "../../utils.ts";
import {TiltifyWebService} from "../../../lib/externalAPI/TiltifyWebService.ts";
import {UserSocialsServiceWithUser} from "../../../lib/db/services/users/socials/UserSocialsServiceWithUser.ts";

/**
 * Fetches social media links from the user's Tiltify account and adds them to their profile.
 * Input: None
 * Action: Retrieves the user's Tiltify token, fetches their social media links from Tiltify, and adds them to the UserDO.
 * Returns: An object with success status and results for each social media platform.
 */
export const fetchSocialsFromTiltify = defineAction({
  handler: async (_, context) => {
    const {session, user} = handleUnauthorized(context);
    const userId = user.id;

    const tiltifyAPI = TiltifyWebService.action(context);
    // Get the user's Tiltify token
    let tiltifyToken;
    try {
      tiltifyToken = await tiltifyAPI.getTokenFromContext(context);
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

    // Get the Tiltify user data
    let tiltifyUser;
    try {
      const response = await tiltifyAPI.getUser(tiltifyToken);
      if (response.error || !response.data) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Tiltify user data'
        });
      }
      tiltifyUser = response.data;
    } catch (error) {
      console.error('Error getting Tiltify user data:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get Tiltify user data'
      });
    }

    // Add socials from Tiltify data
    const socials = tiltifyUser.social;
    const results: { provider: string, success: boolean }[] = [];

    try {
      const userSocialsService = UserSocialsServiceWithUser.action(context, userId);

      // Add Twitch social if available
      if (socials.twitch) {
        const twitchUrl = socials.twitch.startsWith('http')
          ? socials.twitch
          : `https://twitch.tv/${socials.twitch}`;

        try {
          await userSocialsService.addSocial({
            provider: 'twitch',
            url: twitchUrl
          }, userId);
          results.push({provider: 'twitch', success: true});
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
          await userSocialsService.addSocial({
            provider: 'twitter',
            url: twitterUrl
          }, userId);
          results.push({provider: 'twitter', success: true});
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
          await userSocialsService.addSocial({
            provider: 'youtube',
            url: youtubeUrl
          }, userId);
          results.push({provider: 'youtube', success: true});
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
          await userSocialsService.addSocial({
            provider: 'instagram',
            url: instagramUrl
          }, userId);
          results.push({provider: 'instagram', success: true});
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
          await userSocialsService.addSocial({
            provider: 'tiktok',
            url: tiktokUrl
          }, userId);
          results.push({provider: 'tiktok', success: true});
        } catch (error) {
          console.error('Error adding TikTok social:', error);
          results.push({provider: 'tiktok', success: false});
        }
      }
    } catch (error) {
      console.error('Error setting user socials:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to set user socials'
      });
    };

    return {
      success: true,
      results
    };
  }
});

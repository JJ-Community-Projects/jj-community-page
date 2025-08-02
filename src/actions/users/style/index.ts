import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {handleUnauthorized} from "../../utils.ts";
import {UserServiceWithUser} from "../../../lib/db/services/users/UserServiceWithUser.ts";

/**
 * Updates the user's style preferences.
 * Input: An object containing:
 *   - primaryColor (string) - The primary color in hex format
 *   - accentColor (string) - The accent color in hex format
 * Action: Updates the user's style preferences in the database and UserDO.
 * Returns: An object with a success flag.
 */
export const updateUserStyle = defineAction({
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
    const { user } = handleUnauthorized(context);
    const userId = user.id;

    try {
      const userService = UserServiceWithUser.action(context, userId);
      await userService.updateStyle({
        primaryColor,
        accentColor
      }, userId);

      return {success: true};
    } catch (error) {
      console.error('Failed to update user style:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user style'
      });
    }
  }
});

export const style = {
  updateUserStyle
};

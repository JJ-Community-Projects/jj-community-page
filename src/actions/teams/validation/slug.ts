import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {createSlug, generateTeamSlugAlternatives} from "../../../functions/slug.ts";

/**
 * Checks if a slug is valid and available for use with a team.
 * Input: An object containing:
 *   - slug (string) - The slug to validate
 *   - tiltifyName (string, optional) - The Tiltify username to generate alternative suggestions
 * Action: Validates if the provided slug is available for use and generates alternatives if not.
 * Returns: An object with isValid flag and an array of suggested alternatives if the slug is not valid.
 */
export const isSlugValid = defineAction({
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
});

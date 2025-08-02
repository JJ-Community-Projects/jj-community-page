import {ActionError, defineAction} from "astro:actions";
import {z} from "astro:content";
import {createSlug, generateScheduleSlugAlternatives} from "../../../functions/slug.ts";
import {ScheduleService} from "../../../lib/db/services/schedules/ScheduleService.ts";

/**
 * Checks if a slug is valid and available for use.
 * Input: An object containing:
 *   - id (number) - The ID of the schedule
 *   - slug (string) - The slug to validate
 *   - title (string, optional) - The title of the schedule
 * Action: Validates if the provided slug is available for use and generates alternatives if not.
 * Returns: An object with isValid flag and an array of suggested alternatives if the slug is not valid.
 */
export const isSlugValid = defineAction({
  input: z.object({
    id: z.number(),
    slug: z.string(),
    title: z.string().optional(),
  }),
  handler: async ({id, slug, title}, ctx) => {
    const {session, user} = ctx.locals
    if (!session) {
      throw new ActionError({code: 'UNAUTHORIZED'})
    }
    if (!slug) {
      throw new ActionError({code: 'BAD_REQUEST', message: 'Slug is required'})
    }

    // Initialize ScheduleService
    const scheduleService = ScheduleService.action(ctx);

    // First check if the slug is valid using ScheduleService.isValidSlug
    const isValid = await scheduleService.isValidSlug(slug);

    // Note: We're still using generateScheduleSlugAlternatives which uses direct DB access
    // This is because the function is in a separate file and modifying it is outside the scope
    // of the current migration task

    // Get alternatives using the generateScheduleSlugAlternatives function
    // If it returns alternatives, the slug is not valid
    const alternatives = await generateScheduleSlugAlternatives(ctx, slug, 3, id);

    // If alternatives is empty, the slug is valid
    if (alternatives.length === 0) {
      return {
        isValid: true,
        suggestions: []
      };
    }

    // Add title as a suggestion if provided and different from slug
    let allAlternatives = [...alternatives];

    if (title && title.toLowerCase() !== slug.toLowerCase()) {
      const titleSlug = createSlug(title);
      // Check if this slug is valid using generateScheduleSlugAlternatives
      // If it returns an empty array, the slug is valid
      const titleAlternatives = await generateScheduleSlugAlternatives(ctx, titleSlug, 0, id);
      if (titleAlternatives.length === 0) {
        allAlternatives.push(titleSlug);
      }
    }

    return {
      isValid: false,
      suggestions: allAlternatives
    };
  }
});

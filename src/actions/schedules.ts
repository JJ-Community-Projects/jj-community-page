import {ActionError, defineAction} from "astro:actions";
import {DateTime} from "luxon";
import {z} from "astro:content";
import {createSlug, generateScheduleSlugAlternatives} from "../functions/slug.ts";
import {getTags} from "../functions/getTags.ts";
import {ScheduleRepo} from "../lib/db/repos/ScheduleRepo.ts";
import {getScheduleEditorDO, getUserDO} from "./getDO.ts";


export const schedules = {
  /**
   * Creates a new schedule for the authenticated user.
   * Input: None
   * Action: Creates a new schedule for the current year, initializes the ScheduleEditorDO,
   *         and adds the schedule to the UserDO.
   * Returns: An object containing the created schedule.
   */
  create: defineAction({
    handler: async (_, ctx) => {
      const {session, user} = ctx.locals
      if (!session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      const schedules = ScheduleRepo.action(ctx)
      const currentYear = DateTime.now().year

      // Check if user already has a schedule
      const existingSchedules = await schedules.findByOwnerId(user.id)
      const existingSchedule = existingSchedules.find(schedule => schedule.year === currentYear)

      if (existingSchedule) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule for this year already exists'})
      }

      const title = `${user.tiltifyName}'s Schedule ${currentYear}`
      const slug = createSlug(title)

      // Create schedule using repository
      const schedule = await schedules.create({
        ownerId: user.id,
        title: title,
        year: currentYear,
        slug: slug,
        visible: false,
      })

      // Initialize the ScheduleEditorDO for this schedule
      const stubScheduleEditorDO = getScheduleEditorDO(ctx, schedule.id);

      try {
        await stubScheduleEditorDO.loadFromDB()
      } catch (e: any) {
        console.error('Error loading schedule from DB:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      // Add the schedule to the UserDO
      const stubUserDO = getUserDO(ctx, user.id);

      try {
        await stubUserDO.addSchedule(schedule)
      } catch (e: any) {
        console.error('Error adding schedule to UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {schedule}
    }
  }),
  /**
   * Saves the current state of a schedule to the database.
   * Input: scheduleId (number) - The ID of the schedule to save
   * Action: Verifies the user owns the schedule and then saves the schedule's current state from the ScheduleEditorDO to the database.
   * Returns: An object with a success message.
   */
  save: defineAction({
    input: z.number(),
    handler: async (scheduleId, ctx) => {
      const {session, user} = ctx.locals
      if (!session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }

      if (!scheduleId) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
      }

      // Get the schedule from the database to check ownership
      const schedules = ScheduleRepo.action(ctx)
      const schedule = await schedules.findById(scheduleId)

      if (!schedule) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found'})
      }

      // Check if the user owns this schedule
      if (schedule.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'You do not have permission to edit this schedule'})
      }

      // Get the ScheduleEditorDO and save to DB
      const stubScheduleEditorDO = getScheduleEditorDO(ctx, scheduleId);

      try {
        await stubScheduleEditorDO.saveToDB()
      } catch (e: any) {
        console.error('Error saving schedule to DB:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }

      return {message: "Schedule saved successfully"}
    }
  }),
  /**
   * Deletes a schedule owned by the authenticated user.
   * Input: scheduleId (number) - The ID of the schedule to delete
   * Action: Verifies the user owns the schedule, deletes it from the database, and removes it from the UserDO.
   * Returns: An object with a success message.
   */
  delete: defineAction({
    input: z.number(),
    handler: async (scheduleId, ctx) => {
      const {session, user} = ctx.locals
      if (!session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }
      if (!scheduleId) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule ID is required'})
      }

      // Get the schedule from the database to check ownership
      const schedules = ScheduleRepo.action(ctx)
      const schedule = await schedules.findById(scheduleId)

      if (!schedule) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found'})
      }

      // Check if the user owns this schedule
      if (schedule.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'You do not have permission to edit this schedule'})
      }

      // Delete the schedule using repository
      await schedules.delete(scheduleId)

      const stubUserDO = getUserDO(ctx, user.id);

      try {
        await stubUserDO.deleteSchedule(schedule.id)
      } catch (e: any) {
        console.error('Error deleting schedule from UserDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }


      return {message: "Schedule successfully deleted"}
    }
  }),

  /**
   * Checks if a slug is valid and available for use.
   * Input: An object containing:
   *   - id (number) - The ID of the schedule
   *   - slug (string) - The slug to validate
   *   - title (string, optional) - The title of the schedule
   * Action: Validates if the provided slug is available for use and generates alternatives if not.
   * Returns: An object with isValid flag and an array of suggested alternatives if the slug is not valid.
   */
  isSlugValid: defineAction({
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
  }),

  /**
   * Retrieves the most popular tags used across all schedules.
   * Input: limit (number, default: 5) - The maximum number of popular tags to return
   * Action: Queries the database for the most frequently used tags and supplements with default tags if needed.
   * Returns: An object containing popular tags, default tags, and charity tags with their usage counts.
   */
  getPopularTags: defineAction({
    input: z.number().default(5),
    handler: async (limit, ctx) => {
      const schedules = ScheduleRepo.action(ctx);

      // Since ScheduleRepo doesn't have a method for getting popular tags,
      // we'll use the db property to create a custom query

      // 1. Get all tags from the database, ordered by count
      // Note: We're using the db property directly since there's no specific method for this
      const popularTags = await schedules.getPopularTags(limit);

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
  /**
   * Retrieves suggested tags for a specific stream.
   * Input: An object containing:
   *   - streamId (number) - The ID of the stream
   *   - scheduleId (number) - The ID of the schedule
   *   - limit (number, default: 5) - The maximum number of suggested tags to return
   * Action: Finds popular tags that aren't already used in the stream.
   * Returns: An object containing suggested tags, default tags, and charity tags that aren't already used in the stream.
   */
  getSuggestedTagsForStream: defineAction({
    input: z.object({
      streamId: z.number(),
      scheduleId: z.number(),
      limit: z.number().default(5),
    }),
    handler: async ({streamId, scheduleId, limit}, ctx) => {
      const schedules = ScheduleRepo.action(ctx);

      // 1. Search all tags of the stream using ScheduleRepo
      const streamTags = await schedules.findStreamTags(streamId, scheduleId);
      const streamTagValues = streamTags.map(t => t.tag);

      // 2. Find the most used tags that aren't part of the stream
      const popularTags = schedules.getSuggestedTagsForStream(
        streamId,
        scheduleId,
        limit,
        streamTagValues
      )

      // 3. Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // 4. Return an object with charityTags and tags, excluding tags already part of the stream
      const filteredCharityTags = charityTags
        .filter(tag => !streamTagValues.includes(tag.tag))
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      const filteredDefaultTags = defaultTags
        .filter(tag => !streamTagValues.includes(tag.tag))
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
  /**
   * Retrieves suggested tags for a stream that match a search term.
   * Input: An object containing:
   *   - streamId (number) - The ID of the stream
   *   - scheduleId (number) - The ID of the schedule
   *   - term (string) - The search term to match against tags
   *   - limit (number, default: 5) - The maximum number of suggested tags to return
   * Action: Finds tags that match the search term and aren't already used in the stream.
   * Returns: An object containing matching tags from the database, default tags, and charity tags.
   */
  getSuggestedTagsForStreamBySearchTerm: defineAction({
    input: z.object({
      streamId: z.number(),
      scheduleId: z.number(),
      term: z.string(),
      limit: z.number().default(5),
    }),
    handler: async ({streamId, scheduleId, term, limit}, ctx) => {
      const schedules = ScheduleRepo.action(ctx);

      // 1. Search all tags of the stream using ScheduleRepo
      const streamTags = await schedules.findStreamTags(streamId, scheduleId);
      const streamTagValues = streamTags.map(t => t.tag);

      // 2. Find the most used tags that aren't part of the stream and match the search term
      // Note: We're using the db property directly since there's no specific method for this
      const databaseTags = await schedules.getSuggestedTagsForStreamBySearchTerm(
        streamId,
        scheduleId,
        limit,
        streamTagValues,
        term
      )

      // 3. Get the default tags from the getTags function
      const {tags: defaultTags, charityTags} = getTags();

      // 4. If we don't have enough tags from the database, supplement with default tags
      const searchTermLower = term.toLowerCase();

      // Filter default tags that match the search term and aren't already in the stream
      const filteredDefaultTags = defaultTags
        .filter(tag =>
          !streamTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      // Filter charity tags that match the search term and aren't already in the stream
      const filteredCharityTags = charityTags
        .filter(tag =>
          !streamTagValues.includes(tag.tag) &&
          tag.tag.includes(searchTermLower)
        )
        .map(tag => ({
          ...tag,
          count: 0 // Default count since we're not querying the database
        }));

      // 5. If we still don't have enough tags, add more default tags that aren't in the stream
      // (regardless of whether they match the search term)
      let additionalDefaultTags: {
        label: string,
        tag: string
        count: number
      }[] = [];
      if (databaseTags.length + filteredDefaultTags.length + filteredCharityTags.length < limit) {
        additionalDefaultTags = defaultTags
          .filter(tag =>
            !streamTagValues.includes(tag.tag) &&
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

  /**
   * Retrieves the tables data from a schedule's ScheduleEditorDO.
   * Input: scheduleId (number) - The ID of the schedule
   * Action: Gets the tables data from the ScheduleEditorDO for the specified schedule.
   * Returns: The tables data from the ScheduleEditorDO.
   */
  getTables: defineAction({
    input: z.number(),
    handler: async (scheduleId, ctx) => {
      const stubScheduleEditorDO = getScheduleEditorDO(ctx, scheduleId);

      try {
        return await stubScheduleEditorDO.getTables()
      } catch (e: any) {
        console.error('Error getting tables from ScheduleEditorDO:', e);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }
    }
  })
}

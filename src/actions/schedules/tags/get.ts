import {defineAction} from "astro:actions";
import {z} from "astro:content";
import {getTags} from "../../../functions/getTags.ts";

/**
 * Retrieves the most popular tags used across all schedules.
 * Input: limit (number, default: 5) - The maximum number of popular tags to return
 * Action: Queries the database for the most frequently used tags and supplements with default tags if needed.
 * Returns: An object containing popular tags, default tags, and charity tags with their usage counts.
 */
export const getPopularTags = defineAction({
  input: z.number().default(5),
  handler: async (limit, ctx) => {
    const tagsRepo = StreamTagRepo.action(ctx);

    // Since ScheduleRepo doesn't have a method for getting popular tags,
    // we'll use the db property to create a custom query

    // 1. Get all tags from the database, ordered by count
    // Note: We're using the db property directly since there's no specific method for this
    const popularTags = await tagsRepo.getPopularTags(limit);

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
});

/**
 * Retrieves suggested tags for a specific stream.
 * Input: An object containing:
 *   - streamId (number) - The ID of the stream
 *   - scheduleId (number) - The ID of the schedule
 *   - limit (number, default: 5) - The maximum number of suggested tags to return
 * Action: Finds popular tags that aren't already used in the stream.
 * Returns: An object containing suggested tags, default tags, and charity tags that aren't already used in the stream.
 */
export const getSuggestedTagsForStream = defineAction({
  input: z.object({
    streamId: z.number(),
    scheduleId: z.number(),
    limit: z.number().default(5),
  }),
  handler: async ({streamId, scheduleId, limit}, ctx) => {
    const tagsRepo = StreamTagRepo.action(ctx);

    // 1. Search all tags of the stream using ScheduleRepo
    const streamTags = await tagsRepo.findStreamTags(streamId, scheduleId);
    const streamTagValues = streamTags.map(t => t.tag);

    // 2. Find the most used tags that aren't part of the stream
    const popularTags = await tagsRepo.getSuggestedTagsForStream(
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
});

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
export const getSuggestedTagsForStreamBySearchTerm = defineAction({
  input: z.object({
    streamId: z.number(),
    scheduleId: z.number(),
    term: z.string(),
    limit: z.number().default(5),
  }),
  handler: async ({streamId, scheduleId, term, limit}, ctx) => {
    const tagsRepo = StreamTagRepo.action(ctx);

    // 1. Search all tags of the stream using ScheduleRepo
    const streamTags = await tagsRepo.findStreamTags(streamId, scheduleId);
    const streamTagValues = streamTags.map(t => t.tag);

    // 2. Find the most used tags that aren't part of the stream and match the search term
    // Note: We're using the db property directly since there's no specific method for this
    const databaseTags = await tagsRepo.getSuggestedTagsForStreamBySearchTerm(
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
});

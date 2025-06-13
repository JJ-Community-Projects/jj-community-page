import {ActionError, defineAction} from "astro:actions";
import {getDB} from "../lib/db/db";
import {schedulesTable, streamTagsTable} from "../lib/db/schema/schema.ts";
import {DateTime} from "luxon";
import {and, desc, eq, like, notInArray, sql} from "drizzle-orm";
import {z} from "astro:content";
import {createSlug, generateScheduleSlugAlternatives} from "../functions/slug.ts";
import {getTags} from "../functions/getTags.ts";


export const schedules = {
  create: defineAction({
    handler: async (_, ctx) => {
      const {session, user} = ctx.locals
      if (!session) {
        throw new ActionError({code: 'UNAUTHORIZED'})
      }
      const db = getDB(ctx)
      const currentYear = DateTime.now().year
      const existingSchedule = await db.select()
        .from(schedulesTable)
        .where(and(eq(schedulesTable.ownerId, user.id)))
        .get()

      if (existingSchedule) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Schedule for this year already exists'})
      }
      const title = `${user.tiltifyName}'s Schedule ${DateTime.now().year}`
      const slug = createSlug(title)
      const [schedule] = await db.insert(schedulesTable)
        .values({
          ownerId: user.id,
          title: title,
          year: DateTime.now().year,
          slug: slug,
          visible: false,
        })
        .returning()

      // Initialize the ScheduleEditorDO for this schedule
      const ScheduleEditorDO = ctx.locals.runtime.env.ScheduleEditorDO
      const stubScheduleEditorDO = ScheduleEditorDO.get(ScheduleEditorDO.idFromName(`${schedule.id}`))
      await stubScheduleEditorDO.loadFromDB()

      // Add the schedule to the UserDO
      const DO = ctx.locals.runtime.env.UserDO
      const id = DO.idFromName(`${user.id}`)
      const stubUserDO = DO.get(id)
      await stubUserDO.addSchedule(schedule)

      return {schedule}
    }
  }),
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
      const db = getDB(ctx)
      const schedule = await db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()

      if (!schedule) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found'})
      }

      // Check if the user owns this schedule
      if (schedule.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'You do not have permission to edit this schedule'})
      }

      // Get the ScheduleEditorDO and save to DB
      const ScheduleEditorDO = ctx.locals.runtime.env.ScheduleEditorDO
      const stubScheduleEditorDO = ScheduleEditorDO.get(ScheduleEditorDO.idFromName(`${scheduleId}`))
      await stubScheduleEditorDO.saveToDB()

      return {message: "Schedule saved successfully"}
    }
  }),
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
      const db = getDB(ctx)
      const schedule = await db.select()
        .from(schedulesTable)
        .where(eq(schedulesTable.id, scheduleId))
        .get()
      if (!schedule) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Schedule not found'})
      }
      // Check if the user owns this schedule
      if (schedule.ownerId !== user.id) {
        throw new ActionError({code: 'FORBIDDEN', message: 'You do not have permission to edit this schedule'})
      }
      await db.delete(schedulesTable)
        .where(and(eq(schedulesTable.id, scheduleId), eq(schedulesTable.ownerId, user.id)))
        .run()

      const DO = ctx.locals.runtime.env.UserDO
      const id = DO.idFromName(`${user.id}`)
      const stubUserDO = DO.get(id)
      await stubUserDO.deleteSchedule(schedule.id)


      return {message: "Schedule successfully deleted"}
    }
  }),

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

  getPopularTags: defineAction({
    input: z.number().default(5),
    handler: async (limit, ctx) => {
      const db = getDB(ctx);

      // 1. Get all tags from the database, ordered by count
      const popularTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();

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
  getSuggestedTagsForStream: defineAction({
    input: z.object({
      streamId: z.number(),
      scheduleId: z.number(),
      limit: z.number().default(5),
    }),
    handler: async ({streamId, scheduleId, limit}, ctx) => {
      const db = getDB(ctx);

      // 1. Search all tags of the stream
      const streamTags = await db
        .select({
          tag: streamTagsTable.tag,
        })
        .from(streamTagsTable)
        .where(
          and(
            eq(streamTagsTable.streamId, streamId),
            eq(streamTagsTable.scheduleId, scheduleId)
          )
        )
        .all();

      const streamTagValues = streamTags.map(t => t.tag);

      // 2. Find the 5 most used tags that aren't part of the stream
      const popularTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .where(
          and(
            // Exclude tags that are already part of the stream
            notInArray(streamTagsTable.tag, streamTagValues)
          )
        )
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();


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
  getSuggestedTagsForStreamBySearchTerm: defineAction({
    input: z.object({
      streamId: z.number(),
      scheduleId: z.number(),
      term: z.string(),
      limit: z.number().default(5),
    }),
    handler: async ({streamId, scheduleId, term, limit}, ctx) => {
      const db = getDB(ctx);
      // 1. Search all tags of the stream
      const streamTags = await db
        .select({
          tag: streamTagsTable.tag,
        })
        .from(streamTagsTable)
        .where(
          and(
            eq(streamTagsTable.streamId, streamId),
            eq(streamTagsTable.scheduleId, scheduleId)
          )
        )
        .all();

      const streamTagValues = streamTags.map(t => t.tag);

      // 2. Find the most used tags that aren't part of the stream and match the search term
      const databaseTags = await db
        .select({
          tag: streamTagsTable.tag,
          label: streamTagsTable.label,
          count: sql<number>`count(
          ${streamTagsTable.tag}
          )`.as('count')
        })
        .from(streamTagsTable)
        .where(
          and(
            // Exclude tags that are already part of the stream
            notInArray(streamTagsTable.tag, streamTagValues),
            like(streamTagsTable.tag, `%${term.toLowerCase()}%`)
          )
        )
        .groupBy(streamTagsTable.tag)
        .orderBy((s) => {
          return desc(s.count)
        })
        .limit(limit)
        .all();

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

  getTables: defineAction({
    input: z.number(),
    handler: async (scheduleId, ctx) => {
      const ScheduleEditorDO = ctx.locals.runtime.env.ScheduleEditorDO
      const stubScheduleEditorDO = ScheduleEditorDO.get(ScheduleEditorDO.idFromName(`${scheduleId}`))
      return stubScheduleEditorDO.getTables()
    }
  })
}

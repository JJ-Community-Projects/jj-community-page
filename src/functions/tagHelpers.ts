import {DrizzleD1Database} from "drizzle-orm/d1";
import {streamTagsTable} from "../lib/db/schema/schema.ts";
import {and, eq, not, notInArray, or, sql} from "drizzle-orm";
import {getTags} from "./getTags.ts";
import type {BatchItem} from "drizzle-orm/batch";
import {similarity} from "./similarity.ts";

/**
 * Helper function to check if a tag exists in an array of tag objects
 *
 * @param tagObjects - Array of tag objects with tag and label properties
 * @param tagValue - The tag value to check for
 * @returns True if the tag exists in the array, false otherwise
 */
function tagExistsInObjects(tagObjects: Array<{ tag: string, label: string }>, tagValue: string): boolean {
  return tagObjects.some(tagObj => tagObj.tag === tagValue);
}

/**
 * Returns a default response with the top 3 most used default tags.
 * Used when no tags match the search criteria.
 *
 * @param db - The database connection
 * @param searchTerm - Optional search term to filter tags
 * @returns Object containing empty tags array and top 3 default tags
 */
export async function getDefaultTagsResponse(db: DrizzleD1Database, searchTerm?: string) {
  console.log('getDefaultTagsResponse', searchTerm)
  const {tags: defaultTags, charityTags} = getTags();

  // Use getTagsUsageCounts to get counts for all default tags in a single batch
  const defaultTagCounts = await getTagsUsageCounts(db, defaultTags);

  // Sort by count descending
  defaultTagCounts.sort((a, b) => b.count - a.count);

  // Get actual usage counts for charity tags
  const formattedCharityTags = await getTagsUsageCounts(db, charityTags);

  // If search term is provided, use similarity function to find matching tags
  if (searchTerm && searchTerm.trim() !== '') {
    // Apply similarity function to default tags
    const similarDefaultTags = similarity(
      searchTerm,
      defaultTagCounts,
      (tag) => tag.label
    );

    // Apply similarity function to charity tags
    const similarCharityTags = similarity(
      searchTerm,
      formattedCharityTags,
      (tag) => tag.label
    );

    console.log('similarDefaultTags', similarDefaultTags)
    console.log('similarCharityTags', similarCharityTags)

    return {
      tags: [],
      defaultTags: similarDefaultTags.slice(0, 3).map(item => item.data),
      charityTags: similarCharityTags.map(item => item.data)
    };
  }

  console.log('defaultTagCounts', defaultTagCounts)
  console.log('formattedCharityTags', formattedCharityTags)

  return {
    tags: [],
    defaultTags: defaultTagCounts.slice(0, 3),
    charityTags: formattedCharityTags
  };
}

/**
 * Gets tags that match a search term while excluding tags from a specific stream.
 * This is used when both a tag search term and stream ID are provided.
 *
 * @param db - The database connection
 * @param searchTag - The tag search term
 * @param streamId - The stream ID to exclude
 * @param scheduleId - The schedule ID to exclude
 * @param limit - Maximum number of tags to return
 * @returns Object containing matching tags and top 3 default tags
 */
export async function getTagsWithStreamExclusion(db: DrizzleD1Database, searchTag: string, streamId: number, scheduleId: number, limit: number, excludeTags?: string[]) {
  console.log('getTagsWithStreamExclusion', searchTag, streamId, scheduleId, limit, excludeTags);

  // Convert all tags to lowercase for consistent matching if excludeTags is provided
  const normalizedExcludeTags = excludeTags?.map(tag => tag.toLowerCase());
  if (excludeTags && excludeTags.length > 0) {
    console.log('getTagsWithStreamExclusion', 'normalizedExcludeTags', normalizedExcludeTags);
  }

  // Get tags that are part of the specified stream
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
  console.log('getTagsWithStreamExclusion', 'streamTagValues', streamTagValues);

  // Get all tags not from the specified stream
  let allTags;

  if (excludeTags && excludeTags.length > 0) {
    // Execute query with exclude tags condition
    /**
     * Query to get all tags not from the specified stream and not in the excluded tags list.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   NOT (stream_id = ? AND schedule_id = ?)
     *   AND tag NOT IN (?, ?, ...)
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(
        and(or(
            not(eq(streamTagsTable.streamId, streamId)),
            not(eq(streamTagsTable.scheduleId, scheduleId))
          ),
          notInArray(streamTagsTable.tag, normalizedExcludeTags!))
        /*
        and(
          not(
            and(
              eq(streamTagsTable.streamId, streamId),
              eq(streamTagsTable.scheduleId, scheduleId)
            )
          ),
          notInArray(streamTagsTable.tag, normalizedExcludeTags!)
        )
        */
      )
      .groupBy(streamTagsTable.tag)
      .all();
  } else {
    // Execute query without exclude tags condition
    /**
     * Query to get all tags not from the specified stream.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   NOT (stream_id = ? AND schedule_id = ?)
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(
        or(
          not(eq(streamTagsTable.streamId, streamId)),
          not(eq(streamTagsTable.scheduleId, scheduleId))
        )
        /*
        not(
          and(
            eq(streamTagsTable.streamId, streamId),
            eq(streamTagsTable.scheduleId, scheduleId)
          )
        )*/
      )
      .groupBy(streamTagsTable.tag)
      .all();
  }

  // If we have a search tag, use similarity function to find the best matches
  let popularTags = allTags;
  if (searchTag && searchTag.trim() !== '') {
    // Apply similarity function to find matching tags
    const similarTags = similarity(
      searchTag,
      allTags,
      (tag) => tag.label || tag.tag
    );

    // Use the similarity results, limited to the requested number
    popularTags = similarTags.slice(0, limit).map(item => item.data);
  } else {
    // If no search tag, just order by count and limit
    popularTags = allTags
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, limit);
  }

  const {tags: defaultTags, charityTags} = getTags();
  console.log('defaultTags', defaultTags)
  console.log('charityTags', charityTags)
  console.log('popularTags', popularTags)

  if (popularTags.length === 0) {
    return getDefaultTagsResponse(db, searchTag);
  }

  // Filter out tags that are already part of the stream
  const filteredPopularTags = popularTags.filter(tag => {
    // Only include if it's not already in the stream
    return !streamTagValues.includes(tag.tag);
  });

  // Filter to only include default tags that are not already part of the stream
  const filteredDefaultTags = popularTags.filter(tag => {
    // Check if it's a default tag
    if (tagExistsInObjects(defaultTags, tag.tag)) {
      // Only include if it's not already in the stream
      return !streamTagValues.includes(tag.tag);
    }
    return false;
  });

  console.log('filteredPopularTags', filteredPopularTags);
  console.log('filteredDefaultTags', filteredDefaultTags);

  // Return the top 3 most used default tags
  const topTags = filteredDefaultTags.slice(0, 3);

  // Get actual usage counts for charity tags
  const formattedCharityTags = await getTagsUsageCounts(db, charityTags);

  return {
    tags: filteredPopularTags,
    defaultTags: topTags,
    charityTags: formattedCharityTags
  };
}

/**
 * Gets tags that match a search term.
 * This is used when only a tag search term is provided.
 *
 * @param db - The database connection
 * @param searchTag - The tag search term
 * @param limit - Maximum number of tags to return
 * @returns Object containing matching tags and top 3 default tags
 */
export async function getTagsBySearchTerm(db: DrizzleD1Database, searchTag: string, limit: number, excludeTags?: string[]) {
  console.log('getTagsBySearchTerm', searchTag, limit, excludeTags);

  // Convert all tags to lowercase for consistent matching if excludeTags is provided
  const normalizedExcludeTags = excludeTags?.map(tag => tag.toLowerCase());
  if (excludeTags && excludeTags.length > 0) {
    console.log('getTagsBySearchTerm', 'normalizedExcludeTags', normalizedExcludeTags);
  }

  // Get all tags
  let allTags;

  if (excludeTags && excludeTags.length > 0) {
    // Execute query with exclude tags condition
    /**
     * Query to get all tags except those in the excluded tags list.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   tag NOT IN (?, ?, ...)
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(notInArray(streamTagsTable.tag, normalizedExcludeTags!))
      .groupBy(streamTagsTable.tag)
      .all();
  } else {
    // Execute query without exclude tags condition
    /**
     * Query to get all tags from the database.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .groupBy(streamTagsTable.tag)
      .all();
  }

  // If we have a search tag, use similarity function to find the best matches
  let popularTags = allTags;
  if (searchTag && searchTag.trim() !== '') {
    // Apply similarity function to find matching tags
    const similarTags = similarity(
      searchTag,
      allTags,
      (tag) => tag.label || tag.tag
    );

    // Use the similarity results, limited to the requested number
    popularTags = similarTags.slice(0, limit).map(item => item.data);
  } else {
    // If no search tag, just order by count and limit
    popularTags = allTags
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, limit);
  }

  const {tags: defaultTags, charityTags} = getTags();

  if (popularTags.length === 0) {
    return getDefaultTagsResponse(db, searchTag);
  }

  // Filter to only include default tags
  const filteredTags = popularTags.filter(tag =>
    tagExistsInObjects(defaultTags, tag.tag)
  );

  // Return the top 3 most used default tags
  const topTags = filteredTags.slice(0, 3);

  // Get actual usage counts for charity tags
  const formattedCharityTags = await getTagsUsageCounts(db, charityTags);

  return {
    tags: popularTags,
    defaultTags: topTags,
    charityTags: formattedCharityTags
  };
}

/**
 * Gets popular tags excluding those from a specific stream.
 * This is used when only stream ID is provided.
 *
 * @param db - The database connection
 * @param streamId - The stream ID to exclude
 * @param scheduleId - The schedule ID to exclude
 * @param limit - Maximum number of tags to return
 * @returns Object containing popular tags and top 3 default tags
 */
export async function getTagsExcludingStream(
  db: DrizzleD1Database,
  streamId: number, scheduleId: number, limit: number, excludeTags?: string[], searchTerm?: string
) {
  console.log('getTagsExcludingStream', streamId, scheduleId, limit, excludeTags, searchTerm);

  // Convert all tags to lowercase for consistent matching if excludeTags is provided
  const normalizedExcludeTags = excludeTags?.map(tag => tag.toLowerCase());
  if (excludeTags && excludeTags.length > 0) {
    console.log('getTagsExcludingStream', 'normalizedExcludeTags', normalizedExcludeTags);
  }

  // Get tags that are part of the specified stream
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
  console.log('getTagsExcludingStream', 'streamTagValues', streamTagValues);

  // Get all tags not from the specified stream
  let allTags;

  if (excludeTags && excludeTags.length > 0) {
    // Execute query with exclude tags condition
    /**
     * Query to get all tags not from the specified stream and not in the excluded tags list.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   NOT (stream_id = ? AND schedule_id = ?)
     *   AND tag NOT IN (?, ?, ...)
     * GROUP BY tag
     */
    allTags = await db
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
          or(
            not(eq(streamTagsTable.streamId, streamId)),
            not(eq(streamTagsTable.scheduleId, scheduleId))
          ),
          notInArray(streamTagsTable.tag, normalizedExcludeTags!)
        )
        /*
        and(
          not(
            and(
              eq(streamTagsTable.streamId, streamId),
              eq(streamTagsTable.scheduleId, scheduleId)
            )
          ),
          notInArray(streamTagsTable.tag, normalizedExcludeTags!)
        )
        */
      )
      .groupBy(streamTagsTable.tag)
      .all();
  } else {
    // Execute query without exclude tags condition
    /**
     * Query to get all tags not from the specified stream.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   NOT (stream_id = ? AND schedule_id = ?)
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(
        or(
          not(eq(streamTagsTable.streamId, streamId)),
          not(eq(streamTagsTable.scheduleId, scheduleId))
        )
        /*
        not(
          and(
            eq(streamTagsTable.streamId, streamId),
            eq(streamTagsTable.scheduleId, scheduleId)
          )
        )
         */
      )
      .groupBy(streamTagsTable.tag)
      .all();
  }
  console.log('getTagsExcludingStream', 'allTags', allTags);

  // If we have a search term, use similarity function to find the best matches
  let popularTags = allTags;
  if (searchTerm && searchTerm.trim() !== '') {
    // Apply similarity function to find matching tags
    const similarTags = similarity(
      searchTerm,
      allTags,
      (tag) => tag.label || tag.tag
    );

    // Use the similarity results, limited to the requested number
    popularTags = similarTags.slice(0, limit).map(item => item.data);
  } else {
    // If no search term, just order by count and limit
    popularTags = allTags
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, limit);
  }

  const {tags: defaultTags, charityTags} = getTags();

  console.log('popularTags', popularTags)
  console.log('defaultTags', defaultTags)
  console.log('charityTags', charityTags)
  if (popularTags.length === 0) {
    return getDefaultTagsResponse(db, searchTerm);
  }

  // Filter out tags that are already part of the stream
  const filteredPopularTags = popularTags.filter(tag => {
    // Only include if it's not already in the stream
    return !streamTagValues.includes(tag.tag);
  });

  // Filter to exclude default tags that are already part of the stream
  const filteredTags = popularTags.filter(tag => {
    // If it's not a default tag, include it
    if (!tagExistsInObjects(defaultTags, tag.tag)) {
      return true;
    }
    // If it's a default tag, only include it if it's not already in the stream
    return !streamTagValues.includes(tag.tag);
  });

  console.log('filteredPopularTags', filteredPopularTags);
  console.log('filteredTags', filteredTags);

  // Return the top 3 most used tags
  const topTags = filteredTags.slice(0, 3);

  // Get actual usage counts for charity tags
  const formattedCharityTags = await getTagsUsageCounts(db, charityTags);

  return {
    tags: filteredPopularTags,
    defaultTags: topTags,
    charityTags: formattedCharityTags
  };
}

/**
 * Gets all popular tags from the database.
 * This is the default function used when no specific parameters are provided.
 *
 * @param db - The database connection
 * @param limit - Maximum number of tags to return
 * @returns Object containing popular tags and top 3 default tags
 */
export async function getAllPopularTags(db: DrizzleD1Database, limit: number, excludeTags?: string[], searchTerm?: string) {
  console.log('getAllPopularTags', limit, excludeTags, searchTerm);

  // Convert all tags to lowercase for consistent matching if excludeTags is provided
  const normalizedExcludeTags = excludeTags?.map(tag => tag.toLowerCase());
  if (excludeTags && excludeTags.length > 0) {
    console.log('getAllPopularTags', 'normalizedExcludeTags', normalizedExcludeTags);
  }

  // Get all tags
  let allTags;

  if (excludeTags && excludeTags.length > 0) {
    // Execute query with exclude tags condition
    /**
     * Query to get all tags except those in the excluded tags list.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * WHERE
     *   tag NOT IN (?, ?, ...)
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(notInArray(streamTagsTable.tag, normalizedExcludeTags!))
      .groupBy(streamTagsTable.tag)
      .all();
  } else {
    // Execute query without exclude tags condition
    /**
     * Query to get all tags from the database.
     * Counts occurrences of each tag and groups by tag name.
     *
     * SQL equivalent:
     * SELECT
     *   tag,
     *   label,
     *   COUNT(tag) AS count
     * FROM stream_tags
     * GROUP BY tag
     */
    allTags = await db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(
        ${streamTagsTable.tag}
        )`.as('count')
      })
      .from(streamTagsTable)
      .groupBy(streamTagsTable.tag)
      .all();
  }

  // If we have a search term, use similarity function to find the best matches
  let popularTags = allTags;
  if (searchTerm && searchTerm.trim() !== '') {
    // Apply similarity function to find matching tags
    const similarTags = similarity(
      searchTerm,
      allTags,
      (tag) => tag.label || tag.tag
    );

    // Use the similarity results, limited to the requested number
    popularTags = similarTags.slice(0, limit).map(item => item.data);
  } else {
    // If no search term, just order by count and limit
    popularTags = allTags
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, limit);
  }

  const {tags: defaultTags, charityTags} = getTags();

  if (popularTags.length === 0) {
    return getDefaultTagsResponse(db, searchTerm);
  }

  // Filter to only include default tags
  const filteredTags = popularTags.filter(tag =>
    tagExistsInObjects(defaultTags, tag.tag)
  );

  // Return the top 3 most used default tags
  const topTags = filteredTags.slice(0, 3);

  // Get actual usage counts for charity tags
  const formattedCharityTags = await getTagsUsageCounts(db, charityTags);

  return {
    tags: popularTags,
    defaultTags: topTags,
    charityTags: formattedCharityTags
  };
}

/**
 * Returns the number of streams that use a specific tag and the tag's label.
 *
 * @param db - The database connection
 * @param tag - The tag to count usage for
 * @returns Object containing the tag, label, and count of streams using the tag
 */
export async function getTagUsageCount(db: DrizzleD1Database, tag: string): Promise<{
  tag: string,
  label: string,
  count: number
}> {
  // Ensure tag is lowercase for consistent matching
  const normalizedTag = tag.toLowerCase();

  // Count distinct stream IDs where the tag matches
  /**
   * Query to count the number of distinct streams that use a specific tag.
   * Returns the tag, its label, and the count of distinct stream IDs.
   *
   * SQL equivalent:
   * SELECT
   *   tag,
   *   label,
   *   COUNT(DISTINCT stream_id) AS count
   * FROM stream_tags
   * WHERE tag = ?
   * LIMIT 1
   */
  const result = await db
    .select({
      tag: streamTagsTable.tag,
      label: streamTagsTable.label,
      count: sql<number>`count(DISTINCT
      ${streamTagsTable.streamId}
      )`.as('count')
    })
    .from(streamTagsTable)
    .where(eq(streamTagsTable.tag, normalizedTag))
    .get();

  return result ? {tag: result.tag, label: result.label, count: result.count} : {
    tag: normalizedTag,
    label: normalizedTag,
    count: 0
  };
}

/**
 * Returns an array of objects containing tags, their labels, and their usage counts.
 * Uses the Drizzle batch API to execute all queries at once.
 *
 * @param db - The database connection
 * @param tags - Array of tags to count usage for
 * @returns Array of objects with tag, label, and count properties
 */
export async function getTagsUsageCounts(db: DrizzleD1Database, tags: Array<{
  tag: string,
  label: string
}>): Promise<Array<{
  tag: string,
  label: string,
  count: number
}>> {
  const batch: BatchItem<'sqlite'>[] = [];
  const normalizedTags: string[] = [];
  const originalLabels: Record<string, string> = {};

  for (const tagObj of tags) {
    // Ensure tag is lowercase for consistent matching
    const normalizedTag = tagObj.tag.toLowerCase();
    normalizedTags.push(normalizedTag);
    originalLabels[normalizedTag] = tagObj.label;

    /**
     * Query to count the number of distinct streams that use a specific tag.
     * Creates a batch of queries, one for each tag, to be executed together.
     *
     * SQL equivalent (for each tag):
     * SELECT
     *   tag,
     *   label,
     *   COUNT(DISTINCT stream_id) AS count
     * FROM stream_tags
     * WHERE tag = ?
     */
    batch.push(db
      .select({
        tag: streamTagsTable.tag,
        label: streamTagsTable.label,
        count: sql<number>`count(DISTINCT
        ${streamTagsTable.streamId}
        )`.as('count')
      })
      .from(streamTagsTable)
      .where(eq(streamTagsTable.tag, normalizedTag)));
  }

  // Ensure we have a non-empty tuple by using the first item and spreading the rest
  if (batch.length === 0) {
    return [];
  }

  const [firstBatchItem, ...restBatchItems] = batch;
  const results = await db.batch([firstBatchItem, ...restBatchItems] as const);

  // Map the results to the expected format
  return normalizedTags.map((tag, index) => {
    const result = results[index]?.[0];
    return {
      tag,
      label: result?.label || originalLabels[tag] || tag, // Use original label or tag as fallback
      count: result?.count || 0
    };
  });
}

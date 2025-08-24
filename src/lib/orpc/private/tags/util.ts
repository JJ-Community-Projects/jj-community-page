import {eq, or, sql} from "drizzle-orm";
import {streamTagsTable, tagCategories, tags, userTagsTable} from "../../../db/schema/tags-schema.ts";

// === Database Query Helper Functions for Tags ===

/**
 * Helper function to calculate user count for a specific tag
 * Returns a SQL expression that counts how many users have this tag
 */
export const getUserCountExpression = (tagId = tags.id) =>
  sql<number>`COALESCE((
    SELECT COUNT(*) 
    FROM ${userTagsTable} 
    WHERE ${userTagsTable.tagId} = ${tagId}
  ), 0)`;

/**
 * Helper function to calculate stream count for a specific tag
 * Returns a SQL expression that counts how many streams have this tag
 */
export const getStreamCountExpression = (tagId = tags.id) =>
  sql<number>`COALESCE((
    SELECT COUNT(*) 
    FROM ${streamTagsTable} 
    WHERE ${streamTagsTable.tagId} = ${tagId}
  ), 0)`;

/**
 * Helper function to calculate total usage count for a specific tag
 * Combines both user count and stream count for comprehensive usage statistics
 */
export const getTotalUsageExpression = (tagId = tags.id) =>
  sql<number>`${getUserCountExpression(tagId)} + ${getStreamCountExpression(tagId)}`;

/**
 * Helper function to build common WHERE conditions for tag visibility
 * Ensures only visible tags are returned in queries
 */
export const getVisibleTagsCondition = () => eq(tags.visible, true);

/**
 * Helper function to build category filter condition
 * Used when filtering tags by a specific category
 */
export const getCategoryFilterCondition = (categoryId?: number) =>
  categoryId ? eq(tags.categoryId, categoryId) : null;

/**
 * Helper function to build WHERE conditions for tag queries
 * Combines visibility and optional category filtering
 */
export const buildTagWhereConditions = (categoryId?: number) => {
  const conditions = [getVisibleTagsCondition()];
  const categoryCondition = getCategoryFilterCondition(categoryId);
  if (categoryCondition) conditions.push(categoryCondition);
  return conditions;
};

/**
 * Helper function to check if a tag has any usage (users or streams)
 * Used to filter out unused tags in certain queries
 */
export const getTagUsageFilterCondition = (tagId = tags.id) =>
  or(
    sql`${getUserCountExpression(tagId)} > 0`,
    sql`${getStreamCountExpression(tagId)} > 0`
  );

/**
 * Common tag selection fields with usage statistics
 * Standardizes the fields returned across different tag queries
 */
export const getTagWithUsageFields = () => ({
  // Basic tag information
  id: tags.id,
  name: tags.name,
  slug: tags.slug,
  description: tags.description,
  categoryId: tags.categoryId,
  color: tags.color,
  // Usage statistics calculated via subqueries
  userCount: getUserCountExpression(),
  streamCount: getStreamCountExpression(),
  totalUsage: getTotalUsageExpression(),
});

/**
 * Extended tag selection fields with usage statistics and category information
 * Used for queries that LEFT JOIN with tagCategories table
 */
export const getTagWithUsageAndCategoryFields = () => ({
  // Basic tag information
  id: tags.id,
  name: tags.name,
  slug: tags.slug,
  description: tags.description,
  categoryId: tags.categoryId,
  color: tags.color,
  // Usage statistics calculated via subqueries
  userCount: getUserCountExpression(),
  streamCount: getStreamCountExpression(),
  totalUsage: getTotalUsageExpression(),
  // Category information (nullable from LEFT JOIN)
  category: {
    id: tagCategories.id,
    slug: tagCategories.slug,
    name: tagCategories.name,
  },
});

/**
 * Helper function to calculate tag count for a specific category
 * Returns a SQL expression that counts visible tags in the category
 */
export const getCategoryTagCountExpression = (categoryId = tagCategories.id) =>
  sql<number>`COALESCE((
    SELECT COUNT(*) 
    FROM ${tags} 
    WHERE ${tags.categoryId} = ${categoryId} 
    AND ${tags.visible} = true
  ), 0)`;

/**
 * Helper function to calculate usage count for tags in a specific category
 * Combines both user and stream usage for all tags in the category
 */
export const getCategoryUsageCountExpression = (categoryId = tagCategories.id) =>
  sql<number>`COALESCE((
    SELECT COUNT(*) 
    FROM ${userTagsTable} 
    INNER JOIN ${tags} ON ${userTagsTable.tagId} = ${tags.id} 
    WHERE ${tags.categoryId} = ${categoryId} 
    AND ${tags.visible} = true
  ), 0) + COALESCE((
    SELECT COUNT(*) 
    FROM ${streamTagsTable} 
    INNER JOIN ${tags} ON ${streamTagsTable.tagId} = ${tags.id} 
    WHERE ${tags.categoryId} = ${categoryId} 
    AND ${tags.visible} = true
  ), 0)`;

/**
 * Common tag category selection fields with statistics
 * Standardizes the fields returned for category queries
 */
export const getCategoryWithStatsFields = () => ({
  // Basic category information
  id: tagCategories.id,
  slug: tagCategories.slug,
  name: tagCategories.name,
  description: tagCategories.description,
  color: tagCategories.color,
  icon: tagCategories.icon,
  sortOrder: tagCategories.sortOrder,
  visible: tagCategories.visible,
  // Category statistics calculated via subqueries
  tagCount: getCategoryTagCountExpression(),
  usageCount: getCategoryUsageCountExpression(),
});

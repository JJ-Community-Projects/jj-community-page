/**
 * Converts a name into a URL-friendly slug. Shared by the server (team / schedule create, slug
 * checks) and the create dialogs, so the slug a dialog checks is the slug that gets stored.
 *
 * @param name - The name to convert to a slug
 * @returns A URL-friendly slug containing only alphanumeric characters and hyphens
 *
 * @example
 * // returns "hello-world"
 * createSlug("Hello World")
 *
 * @example
 * // returns "john-doe-123"
 * createSlug("John Doe 123!")
 */
export function createSlug(name: string): string {
  if (!name) return ''

  return name
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars (except hyphens)
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, '') // Remove trailing hyphens
}

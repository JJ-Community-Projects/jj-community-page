import {oc} from '@orpc/contract';
import {UserDisplaySchema} from "../schemas/users.ts";
import z from 'zod/v4';

/**
 * Private users contracts for authenticated user operations.
 * These endpoints handle user-specific information and data retrieval.
 */

/**
 * Get current authenticated user information
 * Returns the current user as UserDisplaySchema with role information
 * No input required - uses authenticated user ID from context
 * Output: UserDisplaySchema with role field
 */
const getCurrentUserContract = oc
  .output(UserDisplaySchema);


const isAdminContract = oc.output(z.boolean());

export const privateUsersContract = {
  getCurrentUser: getCurrentUserContract,
  isAdminContract,
};

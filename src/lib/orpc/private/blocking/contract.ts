import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {SuccessSchema} from "../schemas/common.ts";
import {UserIdSchema} from "../schemas/users.ts";
import {UserDisplaySchema} from "../schemas/users.ts";


// Block user contract
export const blockUserContract = oc
  .input(z.object({
    blockedUserId: UserIdSchema
  }))
  .output(SuccessSchema);

// Unblock user contract
export const unblockUserContract = oc
  .input(z.object({
    blockedUserId: UserIdSchema
  }))
  .output(SuccessSchema);

/**
 * Gets the blocks of the current user
 */
export const listBlockedUsersContract = oc
  .output(z.array(UserDisplaySchema));

export const blockContract = {
  blockUserContract,
  unblockUserContract,
  listBlockedUsersContract
};

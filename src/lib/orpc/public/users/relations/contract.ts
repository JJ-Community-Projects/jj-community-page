import {oc} from '@orpc/contract'
import {z} from 'zod';
import {UserDisplaySchema, UserIdSchema} from "../../../schemas/users.ts";

// List friends by user ID contract
export const listFriendsByUserIdContract = oc
  .input(z.object({
    userId: UserIdSchema
  }))
  .output(z.array(UserDisplaySchema));

export const friendsContract = oc.router({
  listFriendsByUserId: listFriendsByUserIdContract,
});

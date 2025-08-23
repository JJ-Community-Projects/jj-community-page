import {oc} from '@orpc/contract'
import {z} from "zod/v4";
import {UserIdInputSchema} from "../../schemas/common.ts";
import {UserDisplaySchema} from "../../schemas/UserDisplaySchema.ts";

// List friends by user ID contract
export const listFriendsByUserIdContract = oc
  .input(UserIdInputSchema)
  .output(z.array(UserDisplaySchema))
  .route({
    path: '/users/{userId}/friends',
    method: 'GET',
    operationId: 'listUserFriends',
    summary: 'List user friends',
    description: 'Retrieve the friends list for a specific user with display information',
    tags: ['user-relations'],
    successDescription: 'User friends list retrieved successfully',
    deprecated: false
  });

export const friendsContract = oc.router({
  listFriendsByUserId: listFriendsByUserIdContract,
});

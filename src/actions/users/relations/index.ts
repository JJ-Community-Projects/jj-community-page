import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendship,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests
} from './friends.ts';

import {
  blockUser,
  unblockUser,
  getBlockedUsers
} from './blocks.ts';

// Export all friend-related actions under the friends namespace
export const friends = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendship,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests
};

// Export all block-related actions under the blocks namespace
export const blocks = {
  blockUser,
  unblockUser,
  getBlockedUsers
};

// Export the combined relations object
export const relations = {
  friends,
  blocks
};

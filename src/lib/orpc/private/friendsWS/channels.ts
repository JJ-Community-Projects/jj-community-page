// Channel ID helpers for Friends WS Durable Objects
// Keep deterministic IDs to route to stable DO instances.

export const friendsChannels = {
  // Incoming friend requests for a user (requests they have received)
  userIncomingRequests: (userId: number) => `friends:req:incoming:${userId}`,
  // Outgoing friend requests for a user (requests they have sent)
  userSentRequests: (userId: number) => `friends:req:sent:${userId}`,
  // The live friends list for a user
  userFriendsList: (userId: number) => `friends:list:${userId}`,
} as const;

// Channel ID helpers for Teams WS Durable Objects
// Keep deterministic IDs to route to stable DO instances.

export const teamChannels = {
  userInvites: (userId: number) => `teams:user:invites:${userId}`,
  userTeams: (userId: number) => `teams:user:teams:${userId}`,
  teamAdminInvites: (teamId: number) => `teams:admin:invites:${teamId}`,
  teamAdminMembers: (teamId: number) => `teams:admin:members:${teamId}`,
} as const;

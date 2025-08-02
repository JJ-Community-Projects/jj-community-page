import { management } from './management/index.ts';
import { membership } from './membership/index.ts';
import { validation } from './validation/index.ts';
import { retrieval } from './retrieval/index.ts';
import { invites } from './invites/index.ts';

// Export the domain-based structure
export const teams = {
  management,
  membership,
  validation,
  retrieval,

  // Flat structure for backward compatibility
  create: management.create,
  update: management.update,
  deleteTeam: management.delete,

  leaveTeam: membership.leave,
  removeUser: membership.removeUser,

  isSlugValid: validation.isSlugValid,

  getTeamsByTiltifyUsername: retrieval.getTeamsByTiltifyUsername,
  findVisible: retrieval.findVisible,
  findAllVisibleWithMemberCount: retrieval.findAllVisibleWithMemberCount
};

// Export teamInvites separately for backward compatibility
export const teamInvites = {
  invite: invites.invite,
  removeInvite: invites.removeInvite,
  acceptInvite: invites.acceptInvite,
  rejectInvite: invites.rejectInvite
};

import { invite } from './create.ts';
import {
  removeInvite,
  acceptInvite,
  rejectInvite
} from './manage.ts';

export const invites = {
  invite,
  removeInvite,
  acceptInvite,
  rejectInvite
};

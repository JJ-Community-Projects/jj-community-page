import { create } from './create.ts';
import { update } from './update.ts';
import { deleteTeam } from './delete.ts';

export const management = {
  create,
  update,
  delete: deleteTeam // Use the renamed action but export as 'delete' for backward compatibility
};

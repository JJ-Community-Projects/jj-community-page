import { create } from './create.ts';
import { toggleVisibility, setPrimary, save } from './update.ts';
import { deleteSchedule } from './delete.ts';

export const management = {
  create,
  toggleVisibility,
  setPrimary,
  save,
  delete: deleteSchedule // Use the renamed action but export as 'delete' for backward compatibility
};

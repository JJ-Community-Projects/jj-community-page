import { management } from './management/index.ts';
import { tags } from './tags/index.ts';
import { retrieval } from './retrieval/index.ts';
import { validation } from './validation/index.ts';

// Export the domain-based structure
export const schedules = {
  management,
  tags,
  retrieval,
  validation,

  // Flat structure for backward compatibility
  create: management.create,
  toggleVisibility: management.toggleVisibility,
  setPrimary: management.setPrimary,
  save: management.save,
  delete: management.delete,

  getPopularTags: tags.getPopularTags,
  getSuggestedTagsForStream: tags.getSuggestedTagsForStream,
  getSuggestedTagsForStreamBySearchTerm: tags.getSuggestedTagsForStreamBySearchTerm,

  getTables: retrieval.getTables,
  getSchedulesByTiltifyUsername: retrieval.getSchedulesByTiltifyUsername,
  getNextScheduleByTiltifyUsername: retrieval.getNextScheduleByTiltifyUsername,

  isSlugValid: validation.isSlugValid
};

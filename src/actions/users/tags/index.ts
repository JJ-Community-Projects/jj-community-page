import {
  getSuggestedTagsForUserBySearchTerm,
  getPopularTags,
  getSuggestedTagsForUser
} from './get.ts';
import {
  addTag,
  removeTag
} from './manage.ts';

export const tags = {
  // Tag retrieval actions
  getSuggestedTagsForUserBySearchTerm,
  getPopularTags,
  getSuggestedTagsForUser,

  // Tag management actions
  addTag,
  removeTag
};

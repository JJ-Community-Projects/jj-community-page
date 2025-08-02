import { profile } from './profile/index.ts';
import { search } from './search/index.ts';
import { tags } from './tags/index.ts';
import { socials } from './socials/index.ts';
import { relations, friends } from './relations/index.ts';
import { style } from './style/index.ts';

// Export the combined users object with all modules
export const users = {
  profile,
  search,
  tags,
  socials,
  relations,
  style
};

// Export friends directly for backward compatibility
// This matches the existing pattern in src/actions/index.ts which imports { friends, users }
export { friends };

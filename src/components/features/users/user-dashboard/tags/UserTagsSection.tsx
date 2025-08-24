import {type Component} from "solid-js";
import {TagExplanationAccordion} from "./TagExplanationAccordion.tsx";
import {TagCategorySelection} from "./TagCategorySelection.tsx";
import {TagSearchInput} from "./TagSearchInput.tsx";
import {AvailableTagsList} from "./AvailableTagsList.tsx";
import {UserTagsList} from "./UserTagsList.tsx";

/**
 * UserTagsSection Component
 *
 * Allows normal users to manage their tag associations by selecting from admin-created tags.
 * Enhanced with modern design, glass-morphism effects, and improved user experience.
 *
 * Features:
 * - Browse popular admin-created tags with enhanced visual design
 * - Search for specific tags by name with modern search interface
 * - Add tags to user profile with interactive animations
 * - Remove tags from user profile with better UX
 * - Visual feedback showing which tags are already selected
 * - Responsive design with fluid typography
 * - Comprehensive accessibility support
 *
 * Uses UserTagsProvider context for data management to avoid prop drilling.
 * All child components access data directly from the UserTagsProvider context.
 *
 * Note: Custom tag creation is no longer allowed for normal users.
 * Only administrators can create new tags through the admin interface.
 */
export const UserTagsSection: Component = () => {

  return (
    <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div class="~p-4/8 space-y-6">
        {/* Explanation accordion with enhanced design */}
        <TagExplanationAccordion defaultExpanded={false} />

        {/* Category Selection with modern pills */}
        <TagCategorySelection />

        {/* Enhanced search input */}
        <TagSearchInput />

        {/* Enhanced available tags list */}
        <AvailableTagsList />

        {/* Enhanced user tags list */}
        <UserTagsList />
      </div>
    </div>
  );
};

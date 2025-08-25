import {type Component} from "solid-js";
import {BlockSearchInput} from "./BlockSearchInput.tsx";
import {AvailableUsersToBlockList} from "./AvailableUsersToBlockList.tsx";
import {BlockedUsersList} from "./BlockedUsersList.tsx";

/**
 * UserBlocksSection Component
 *
 * Allows users to search for and block other users, and manage their blocked users list.
 * Enhanced with modern design and improved user experience.
 *
 * Features:
 * - Search for users to block with real-time search
 * - View search results with block functionality
 * - View and manage blocked users list with ability to unblock
 * - Visual feedback showing block status and loading states
 * - Responsive design with fluid typography
 * - Comprehensive accessibility support
 * - Single column layout for linear flow: Search → Results → Blocked Users
 *
 * Uses standard TanStack Query with manual refresh (no SSE) for simpler data management.
 * All child components access data directly from the UserBlockProvider context to avoid prop drilling.
 */
export const UserBlocksSection: Component = () => {

  return (
    <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div class="~p-4/8 space-y-6">

        {/* Block Search Section */}
        <BlockSearchInput />

        {/* Available Users to Block (Search Results) */}
        <AvailableUsersToBlockList />

        {/* Blocked Users List */}
        <BlockedUsersList />

      </div>
    </div>
  );
};

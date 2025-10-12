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
        {/* Explain Section */}
        <div class="relative space-y-4 px-6 pb-6 leading-relaxed text-gray-700 ~text-sm/base">
          <div class="rounded-xl border border-accent/20 bg-gradient-to-br from-white to-accent/5 p-5 shadow-sm ring-1 ring-black/5">
            <ul class="list-disc space-y-1 pl-6 marker:text-accent-600">
              <li>Blocked users cannot send you friend requests.</li>
              <li>Blocked users will not appear in your <strong>Related</strong> section.</li>
              <li>You will not appear in the <strong>Related</strong> section of users you have blocked.</li>
            </ul>
          </div>
        </div>

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

import {type Component} from "solid-js";
import {FriendSearchInput} from "./FriendSearchInput.tsx";
import {AvailableUsersList} from "./AvailableUsersList.tsx";
import {FriendRequestsList} from "./FriendRequestsList.tsx";
import {SentFriendRequestsList} from "./SentFriendRequestsList.tsx";
import {UserFriendsList} from "./UserFriendsList.tsx";

/**
 * UserFriendsSection Component
 *
 * Allows users to manage their friendships by searching for other users and managing friend requests.
 * Enhanced with modern design, glass-morphism effects, and improved user experience.
 *
 * Features:
 * - Search for users to send friend requests with real-time search
 * - View and manage incoming friend requests (accept/decline)
 * - View current friends list with ability to unfriend
 * - Real-time updates via SSE for instant notification of friend activity
 * - Visual feedback showing request status and loading states
 * - Responsive design with fluid typography
 * - Comprehensive accessibility support
 *
 * Uses SSE (Server-Sent Events) for real-time updates of friend requests and friends list.
 * All child components access data directly from the UserFriendsProvider context to avoid prop drilling.
 */
export const UserFriendsSection: Component = () => {

  return (
    <div class="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div class="~p-4/8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Column 1: Search, Available Users, and Friends List */}
          <div class="space-y-6">
            {/* Friend Search Section */}
            <FriendSearchInput />

            {/* Available Users List (Search Results) */}
            <AvailableUsersList />

            {/* Current Friends List */}
            <UserFriendsList />
          </div>

          {/* Column 2: Friend Requests */}
          <div class="space-y-6">
            {/* Friend Requests Section */}
            <FriendRequestsList />

            {/* Sent Friend Requests Section */}
            <SentFriendRequestsList />
          </div>

        </div>
      </div>
    </div>
  );
};

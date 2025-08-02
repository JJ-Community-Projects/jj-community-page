import type {InferSelectModel} from "drizzle-orm";
import {twitchChannelSchema} from "../../schema/twitch-channel-schema.ts";

/**
 * UI representation of a user
 */
export interface UserUI {
  id: number;
  role: string;
  primaryLiveStream: string;
  createdAt: string;
  // TODO add username
  // TODO add slug
  liveState?: UserLiveState
  accounts: UserAccountUI[];
  tags: UserTagUI[];
  socials: UserSocialUI[];
  style: UserStyleUI | null;
}

/**
 * UI representation of a user account
 */
export interface UserAccountUI {
  provider: string;
  providerUsername: string;
  providerDisplayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * UI representation of a user tag
 */
export interface UserTagUI {
  tag: string;
  label: string;
  color: string;
  addedAt: string;
}

/**
 * UI representation of a user social link
 */
export interface UserSocialUI {
  provider: string;
  url: string;
  displayName: string;
  icon: string;
}

/**
 * UI representation of user style preferences
 */
export interface UserStyleUI {
  primaryColor: string;
  accentColor: string;
}

/**
 * UI representation of a user profile
 */
export interface UserProfileUI {
  id: number;
  role: string;
  primaryLiveStream: string;
  createdAt: string;
  accounts: UserAccountUI[];
  tags: UserTagUI[];
  socials: UserSocialUI[];
  style: UserStyleUI | null;
  schedules: UserScheduleUI[];
  teams: UserTeamUI[];
  isLive: boolean;
  liveInfo: UserLiveInfoUI | null;
}

/**
 * UI representation of a user's schedule
 */
export interface UserScheduleUI {
  id: number;
  title: string;
  slug: string;
  year: number;
  visible: boolean;
  primary: boolean;
  streamCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * UI representation of a user's team
 */
export interface UserTeamUI {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  isOwner: boolean;
  memberCount: number;
}

/**
 * UI representation of a user's live streaming info
 */
export interface UserLiveInfoUI {
  platform: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string | null;
  streamUrl: string;
}

/**
 * UI representation of a user list item
 */
export interface UserListItemUI {
  id: number;
  role: string;
  primaryLiveStream: string;
  createdAt: string;
  displayName: string;
  avatar: string | null;
  isLive: boolean;
  tags: UserTagUI[];
}

/**
 * UI representation of a user's friend
 */
export interface UserFriendUI {
  id: number;
  displayName: string;
  avatar: string | null;
  isLive: boolean;
  primaryLiveStream: string;
}

/**
 * UI representation of a user's friend request
 */
export interface UserFriendRequestUI {
  id: number;
  displayName: string;
  avatar: string | null;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
}

/**
 * UI representation of the users live state
 */
export type UserLiveState = {
  id: number; // id, users table
  name: string; // username, account table, tiltify
  slug: string; // user slug, account table, tiltify
  isLive: boolean; // has a twitch stream in twitchStreamSchema table
  primaryLiveStream: string
  channel: {
    twitch?: InferSelectModel<typeof twitchChannelSchema>
    // TODO youtube
  }
}

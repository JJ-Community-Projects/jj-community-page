import type {InferInsertModel, InferSelectModel} from "drizzle-orm";
import type {
  accounts,
  blockedAccounts,
  blockedUsers,
  friendRequests,
  friendsTable,
  users,
  userSocials,
  userStyles,
  userTags
} from "../schema/auth-schema.ts";
import type {TwitchChannel} from "./twitch.ts";
import type {TiltifyUserData} from "../../../functions/tiltify.ts";

/**
 * User entity type from database schema
 */
export type User = InferSelectModel<typeof users>;

/**
 * User insert type for creating new users
 */
export type UserInsert = InferInsertModel<typeof users>;

/**
 * Account entity type from database schema
 */
export type Account = InferSelectModel<typeof accounts>;

/**
 * Account insert type for creating new accounts
 */
export type AccountInsert = InferInsertModel<typeof accounts>;

/**
 * User tag entity type from database schema
 */
export type UserTag = InferSelectModel<typeof userTags>;

/**
 * User tag insert type for creating new user tags
 */
export type UserTagInsert = InferInsertModel<typeof userTags>;

/**
 * User social entity type from database schema
 */
export type UserSocial = InferSelectModel<typeof userSocials>;

/**
 * User social insert type for creating new user socials
 */
export type UserSocialInsert = InferInsertModel<typeof userSocials>;

/**
 * Blocked account entity type from database schema
 */
export type BlockedAccount = InferSelectModel<typeof blockedAccounts>;

/**
 * Blocked account insert type for creating new blocked accounts
 */
export type BlockedAccountInsert = InferInsertModel<typeof blockedAccounts>;

/**
 * User style entity type from database schema
 */
export type UserStyle = InferSelectModel<typeof userStyles>;

/**
 * User style insert type for creating new user styles
 */
export type UserStyleInsert = InferInsertModel<typeof userStyles>;

/**
 * Friend request entity type from database schema
 */
export type FriendRequest = InferSelectModel<typeof friendRequests>;

/**
 * Friend request insert type for creating new friend requests
 */
export type FriendRequestInsert = InferInsertModel<typeof friendRequests>;

/**
 * Friend entity type from database schema
 */
export type Friend = InferSelectModel<typeof friendsTable>;

/**
 * Friend insert type for creating new friends
 */
export type FriendInsert = InferInsertModel<typeof friendsTable>;

/**
 * Blocked user entity type from database schema
 */
export type BlockedUser = InferSelectModel<typeof blockedUsers>;

/**
 * Blocked user insert type for creating new blocked users
 */
export type BlockedUserInsert = InferInsertModel<typeof blockedUsers>;

/**
 * User with accounts relationship
 */
export interface UserWithAccounts extends User {
  accounts: Account[];
}

/**
 * User with tags relationship
 */
export interface UserWithTags extends User {
  tags: UserTag[];
}

/**
 * User with socials relationship
 */
export interface UserWithSocials extends User {
  socials: UserSocial[];
}

/**
 * User with style relationship
 */
export interface UserWithStyle extends User {
  style: UserStyle;
}

/**
 * User with friends relationship
 */
export interface UserWithFriends extends User {
  friends: User[];
}

/**
 * User with friend requests relationship
 */
export interface UserWithFriendRequests extends User {
  friendRequests: {
    incoming: User[];
    outgoing: User[];
  };
}

/**
 * User with blocked users relationship
 */
export interface UserWithBlockedUsers extends User {
  blockedUsers: User[];
}

/**
 * Complete user profile with all relationships
 */
export interface UserProfile extends User {
  tiltify: TiltifyMetadata,
  twitch: TwitchChannel | null,
  style: UserStyle;
  tags: UserTag[];
  socials: UserSocial[];
}

/**
 * Input type for creating a new user
 */
export interface UserInput {
  role?: "user" | "admin";
  primaryLiveStream?: string;
}

/**
 * Input type for creating a new account
 */
export interface AccountInput {
  userId: number;
  provider: string;
  providerId: string;
  providerUsername: string;
  meta?: any;
}

/**
 * Input type for creating a new user tag
 */
export interface UserTagInput {
  userId: number;
  tag: string;
  label: string;
}

/**
 * Input type for creating a new user social
 */
export interface UserSocialInput {
  userId: number;
  provider: string;
  url: string;
}

/**
 * Input type for creating a new user style
 */
export interface UserStyleInput {
  userId: number;
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Tiltify account with properly typed meta field
 */
export interface TiltifyAccount extends Omit<Account, 'meta'> {
  meta: TiltifyUserData | null;
}

/**
 * Type for the fullUsersView which combines user, tiltify account, and twitch channel
 */
export interface FullUser {
  user: User;
  tiltify: TiltifyMetadata;
  twitch: TwitchChannel | null;
}

/**
 * Interface representing the structure of the tiltify_metadata_view
 * This matches the columns defined in the view
 */
export interface TiltifyMetadata {
  userId: number;
  // Avatar
  avatarSrc: string;
  // Basic info
  description: string;
  id: string;
  slug: string;
  url: string;
  username: string;
}


export interface UserSearch {
  userId: number;
  tiltifyUsername: string;
  twitchUsername: string | null;
}


export interface UserTagSearchResult extends Omit<UserTag, 'userId' | 'addedAt'> {
  count: number;
}

/**
 * Interface representing the structure of the user_display_view
 * This matches the columns defined in the view
 */
export interface UserDisplay {
  userId: number;
  primaryLiveStream: string;
  role: "user" | "admin";
  createdAt: Date;
  username: string;
  profileImage: string;
  twitchLogin: string | null;
  tiltifySlug: string;
  tiltifyUrl: string;
  primaryColor: string | null;
  accentColor: string | null;
}

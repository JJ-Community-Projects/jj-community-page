// src/lib/db/newRepos/user/UserRepo.ts
// @ts-ignore
import type { ActionAPIContext } from "astro:actions";
import { BaseRepo } from "../base/BaseRepo";
import type { RepoEnv } from "../../../db/RepoEnv";
import { UserSection } from "./sections/UserSection";
import { AccountSection } from "./sections/AccountSection";
import { TokenSection } from "./sections/TokenSection";
import { UserTagSection } from "./sections/UserTagSection";
import { UserSocialSection } from "./sections/UserSocialSection";
import { BlockedAccountSection } from "./sections/BlockedAccountSection";
import { UserStyleSection } from "./sections/UserStyleSection";
import { FriendRequestSection } from "./sections/FriendRequestSection";
import { FriendSection } from "./sections/FriendSection";
import { BlockedUserSection } from "./sections/BlockedUserSection";
import type {
  User,
  UserInsert,
  Account,
  AccountInsert,
  UserTag,
  UserTagInsert,
  UserSocial,
  UserSocialInsert,
  UserStyle,
  UserStyleInsert,
  UserProfile,
  UserWithAccounts,
  UserWithTags,
  UserWithSocials,
  UserWithStyle,
  UserWithFriends
} from "../../types/user";
import { NotFoundError } from "../../errors";

/**
 * Repository for user domain operations
 * Coordinates between user-related sections
 */
export class UserRepo extends BaseRepo {
  private readonly userSection: UserSection;
  private readonly accountSection: AccountSection;
  private readonly tokenSection: TokenSection;
  private readonly userTagSection: UserTagSection;
  private readonly userSocialSection: UserSocialSection;
  private readonly blockedAccountSection: BlockedAccountSection;
  private readonly userStyleSection: UserStyleSection;
  private readonly friendRequestSection: FriendRequestSection;
  private readonly friendSection: FriendSection;
  private readonly blockedUserSection: BlockedUserSection;

  /**
   * Creates a new UserRepo instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userSection = new UserSection(env, repoEnv);
    this.accountSection = new AccountSection(env, repoEnv);
    this.tokenSection = new TokenSection(env, repoEnv);
    this.userTagSection = new UserTagSection(env, repoEnv);
    this.userSocialSection = new UserSocialSection(env, repoEnv);
    this.blockedAccountSection = new BlockedAccountSection(env, repoEnv);
    this.userStyleSection = new UserStyleSection(env, repoEnv);
    this.friendRequestSection = new FriendRequestSection(env, repoEnv);
    this.friendSection = new FriendSection(env, repoEnv);
    this.blockedUserSection = new BlockedUserSection(env, repoEnv);
  }

  /**
   * Creates a UserRepo instance for use in Astro actions
   * @param ctx - The Astro action context
   * @returns A UserRepo instance
   */
  static action(ctx: ActionAPIContext) {
    return new UserRepo(ctx.locals.runtime.env, 'action');
  }

  /**
   * Gets the user section
   * @returns The user section
   */
  getUserSection(): UserSection {
    return this.userSection;
  }

  /**
   * Gets the account section
   * @returns The account section
   */
  getAccountSection(): AccountSection {
    return this.accountSection;
  }

  /**
   * Gets the token section
   * @returns The token section
   */
  getTokenSection(): TokenSection {
    return this.tokenSection;
  }

  /**
   * Gets the user tag section
   * @returns The user tag section
   */
  getUserTagSection(): UserTagSection {
    return this.userTagSection;
  }

  /**
   * Gets the user social section
   * @returns The user social section
   */
  getUserSocialSection(): UserSocialSection {
    return this.userSocialSection;
  }

  /**
   * Gets the blocked account section
   * @returns The blocked account section
   */
  getBlockedAccountSection(): BlockedAccountSection {
    return this.blockedAccountSection;
  }

  /**
   * Gets the user style section
   * @returns The user style section
   */
  getUserStyleSection(): UserStyleSection {
    return this.userStyleSection;
  }

  /**
   * Gets the friend request section
   * @returns The friend request section
   */
  getFriendRequestSection(): FriendRequestSection {
    return this.friendRequestSection;
  }

  /**
   * Gets the friend section
   * @returns The friend section
   */
  getFriendSection(): FriendSection {
    return this.friendSection;
  }

  /**
   * Gets the blocked user section
   * @returns The blocked user section
   */
  getBlockedUserSection(): BlockedUserSection {
    return this.blockedUserSection;
  }

  /**
   * Finds a user with their accounts
   * @param userId - The ID of the user
   * @returns The user with accounts or undefined if not found
   */
  async findUserWithAccounts(userId: number): Promise<UserWithAccounts | undefined> {
    try {
      const user = await this.userSection.findById(userId);
      if (!user) {
        return undefined;
      }

      const accounts = await this.accountSection.findByUserId(userId);

      return {
        ...user,
        accounts
      };
    } catch (error) {
      this.handleError(`Failed to find user with accounts: ${userId}`, error);
    }
  }

  /**
   * Finds a user with their tags
   * @param userId - The ID of the user
   * @returns The user with tags or undefined if not found
   */
  async findUserWithTags(userId: number): Promise<UserWithTags | undefined> {
    try {
      const user = await this.userSection.findById(userId);
      if (!user) {
        return undefined;
      }

      const tags = await this.userTagSection.findByUserId(userId);

      return {
        ...user,
        tags
      };
    } catch (error) {
      this.handleError(`Failed to find user with tags: ${userId}`, error);
    }
  }

  /**
   * Finds a user with their socials
   * @param userId - The ID of the user
   * @returns The user with socials or undefined if not found
   */
  async findUserWithSocials(userId: number): Promise<UserWithSocials | undefined> {
    try {
      const user = await this.userSection.findById(userId);
      if (!user) {
        return undefined;
      }

      const socials = await this.userSocialSection.findByUserId(userId);

      return {
        ...user,
        socials
      };
    } catch (error) {
      this.handleError(`Failed to find user with socials: ${userId}`, error);
    }
  }

  /**
   * Finds a user with their style
   * @param userId - The ID of the user
   * @returns The user with style or undefined if not found
   */
  async findUserWithStyle(userId: number): Promise<UserWithStyle | undefined> {
    try {
      const user = await this.userSection.findById(userId);
      if (!user) {
        return undefined;
      }

      const style = await this.userStyleSection.findById(userId);

      return {
        ...user,
        style: style || {
          userId,
          primaryColor: '#E30E50', // Default primary color
          accentColor: '#3584BF'   // Default accent color
        }
      };
    } catch (error) {
      this.handleError(`Failed to find user with style: ${userId}`, error);
    }
  }

  /**
   * Finds a user with their friends
   * @param userId - The ID of the user
   * @returns The user with friends or undefined if not found
   */
  async findUserWithFriends(userId: number): Promise<UserWithFriends | undefined> {
    try {
      const user = await this.userSection.findById(userId);
      if (!user) {
        return undefined;
      }

      const friendships = await this.friendSection.findByUserId(userId);

      // Get the friend user IDs (excluding the user themselves)
      const friendIds = friendships
        .map(f => f.fromUserId === userId ? f.toUserId : f.fromUserId)
        .filter(id => id !== userId);

      // Get the friend users
      const friends: User[] = [];
      for (const friendId of friendIds) {
        const friend = await this.userSection.findById(friendId);
        if (friend) {
          friends.push(friend);
        }
      }

      return {
        ...user,
        friends
      };
    } catch (error) {
      this.handleError(`Failed to find user with friends: ${userId}`, error);
    }
  }

  /**
   * Creates a new user with default settings
   * @param data - The user data
   * @returns The created user
   */
  async createUser(data: UserInsert): Promise<User> {
    try {
      const user = await this.userSection.create(data);

      // Create default user style
      await this.userStyleSection.create({
        userId: user.id,
        primaryColor: '#E30E50', // Default primary color
        accentColor: '#3584BF'   // Default accent color
      });

      return user;
    } catch (error) {
      this.handleError("Failed to create user with default settings", error);
    }
  }

  /**
   * Creates a user account
   * @param userId - The ID of the user
   * @param accountData - The account data
   * @returns The created account
   */
  async createUserAccount(userId: number, accountData: Omit<AccountInsert, 'userId'>): Promise<Account> {
    try {
      // Check if user exists
      const user = await this.userSection.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found`);
      }

      return this.accountSection.create({
        userId,
        ...accountData
      });
    } catch (error) {
      this.handleError(`Failed to create account for user: ${userId}`, error);
    }
  }

  /**
   * Adds a tag to a user
   * @param userId - The ID of the user
   * @param tag - The tag value
   * @param label - The tag label
   * @returns The created user tag
   */
  async addUserTag(userId: number, tag: string, label: string): Promise<UserTag> {
    try {
      // Check if user exists
      const user = await this.userSection.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found`);
      }

      // Check if tag already exists
      const existingTag = await this.userTagSection.findById(userId, tag);
      if (existingTag) {
        // Update the label if it's different
        if (existingTag.label !== label) {
          return this.userTagSection.update(userId, tag, { label });
        }
        return existingTag;
      }

      return this.userTagSection.create({
        userId,
        tag,
        label
      });
    } catch (error) {
      this.handleError(`Failed to add tag: ${tag} to user: ${userId}`, error);
    }
  }

  /**
   * Adds a social link to a user
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param url - The social URL
   * @returns The created user social
   */
  async addUserSocial(userId: number, provider: string, url: string): Promise<UserSocial> {
    try {
      // Check if user exists
      const user = await this.userSection.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found`);
      }

      // Check if social already exists
      const existingSocial = await this.userSocialSection.findById(userId, provider);
      if (existingSocial) {
        // Update the URL if it's different
        if (existingSocial.url !== url) {
          return this.userSocialSection.update(userId, provider, { url });
        }
        return existingSocial;
      }

      return this.userSocialSection.create({
        userId,
        provider,
        url
      });
    } catch (error) {
      this.handleError(`Failed to add social: ${provider} to user: ${userId}`, error);
    }
  }

  /**
   * Updates a user's style
   * @param userId - The ID of the user
   * @param styleData - The style data
   * @returns The updated user style
   */
  async updateUserStyle(userId: number, styleData: Omit<UserStyleInsert, 'userId'>): Promise<UserStyle> {
    try {
      // Check if user exists
      const user = await this.userSection.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found`);
      }

      // Check if style already exists
      const existingStyle = await this.userStyleSection.findById(userId);
      if (existingStyle) {
        return this.userStyleSection.update(userId, styleData);
      }

      return this.userStyleSection.create({
        userId,
        ...styleData
      });
    } catch (error) {
      this.handleError(`Failed to update style for user: ${userId}`, error);
    }
  }

  /**
   * Sends a friend request
   * @param fromUserId - The ID of the user sending the request
   * @param toUserId - The ID of the user receiving the request
   * @returns True if the request was sent
   */
  async sendFriendRequest(fromUserId: number, toUserId: number): Promise<boolean> {
    try {
      // Check if users exist
      const fromUser = await this.userSection.findById(fromUserId);
      if (!fromUser) {
        throw new NotFoundError(`User with id ${fromUserId} not found`);
      }

      const toUser = await this.userSection.findById(toUserId);
      if (!toUser) {
        throw new NotFoundError(`User with id ${toUserId} not found`);
      }

      // Check if already friends
      const areFriends = await this.friendSection.areFriends(fromUserId, toUserId);
      if (areFriends) {
        return false; // Already friends
      }

      // Check if request already exists
      const hasPendingRequest = await this.friendRequestSection.hasPendingRequest(fromUserId, toUserId);
      if (hasPendingRequest) {
        return false; // Request already exists
      }

      // Check if blocked
      const isBlocked = await this.blockedUserSection.isBlocked(toUserId, fromUserId);
      if (isBlocked) {
        return false; // Blocked by recipient
      }

      // Send request
      await this.friendRequestSection.create({
        fromUserId,
        toUserId
      });

      return true;
    } catch (error) {
      this.handleError(`Failed to send friend request from user: ${fromUserId} to user: ${toUserId}`, error);
    }
  }

  /**
   * Accepts a friend request
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user accepting the request
   * @returns True if the request was accepted
   */
  async acceptFriendRequest(fromUserId: number, toUserId: number): Promise<boolean> {
    try {
      // Check if request exists
      const request = await this.friendRequestSection.findByUserIds(fromUserId, toUserId);
      if (!request) {
        return false; // No request to accept
      }

      // Create bidirectional friendship
      await this.friendSection.createBidirectional(fromUserId, toUserId);

      // Delete the request
      await this.friendRequestSection.deleteByUserIds(fromUserId, toUserId);

      return true;
    } catch (error) {
      this.handleError(`Failed to accept friend request from user: ${fromUserId} by user: ${toUserId}`, error);
    }
  }

  /**
   * Rejects a friend request
   * @param fromUserId - The ID of the user who sent the request
   * @param toUserId - The ID of the user rejecting the request
   * @returns True if the request was rejected
   */
  async rejectFriendRequest(fromUserId: number, toUserId: number): Promise<boolean> {
    try {
      // Check if request exists
      const request = await this.friendRequestSection.findByUserIds(fromUserId, toUserId);
      if (!request) {
        return false; // No request to reject
      }

      // Delete the request
      await this.friendRequestSection.deleteByUserIds(fromUserId, toUserId);

      return true;
    } catch (error) {
      this.handleError(`Failed to reject friend request from user: ${fromUserId} by user: ${toUserId}`, error);
    }
  }

  /**
   * Removes a friend
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns True if the friend was removed
   */
  async removeFriend(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if friends
      const areFriends = await this.friendSection.areFriends(userId1, userId2);
      if (!areFriends) {
        return false; // Not friends
      }

      // Delete bidirectional friendship
      await this.friendSection.deleteBidirectional(userId1, userId2);

      return true;
    } catch (error) {
      this.handleError(`Failed to remove friend: ${userId2} from user: ${userId1}`, error);
    }
  }

  /**
   * Blocks a user
   * @param userId - The ID of the user doing the blocking
   * @param blockedUserId - The ID of the user to block
   * @returns True if the user was blocked
   */
  async blockUser(userId: number, blockedUserId: number): Promise<boolean> {
    try {
      // Check if users exist
      const user = await this.userSection.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with id ${userId} not found`);
      }

      const blockedUser = await this.userSection.findById(blockedUserId);
      if (!blockedUser) {
        throw new NotFoundError(`User with id ${blockedUserId} not found`);
      }

      // Remove any friendship
      await this.removeFriend(userId, blockedUserId);

      // Remove any pending friend requests
      try {
        await this.friendRequestSection.deleteByUserIds(userId, blockedUserId);
      } catch (error) {
        // Ignore if not found
      }

      try {
        await this.friendRequestSection.deleteByUserIds(blockedUserId, userId);
      } catch (error) {
        // Ignore if not found
      }

      // Block the user
      await this.blockedUserSection.blockUser(userId, blockedUserId);

      return true;
    } catch (error) {
      this.handleError(`Failed to block user: ${blockedUserId} by user: ${userId}`, error);
    }
  }

  /**
   * Unblocks a user
   * @param userId - The ID of the user doing the unblocking
   * @param blockedUserId - The ID of the user to unblock
   * @returns True if the user was unblocked
   */
  async unblockUser(userId: number, blockedUserId: number): Promise<boolean> {
    try {
      // Check if blocked
      const isBlocked = await this.blockedUserSection.isBlocked(userId, blockedUserId);
      if (!isBlocked) {
        return false; // Not blocked
      }

      // Unblock the user
      await this.blockedUserSection.unblockUser(userId, blockedUserId);

      return true;
    } catch (error) {
      this.handleError(`Failed to unblock user: ${blockedUserId} by user: ${userId}`, error);
    }
  }

  /**
   * Deletes a user and all related data
   * @param userId - The ID of the user to delete
   * @returns True if the user was deleted
   */
  async deleteUser(userId: number): Promise<boolean> {
    try {
      // Check if user exists
      const user = await this.userSection.findById(userId);
      if (!user) {
        return false; // User not found
      }

      // Delete the user
      // Note: Due to cascade delete in the database schema, deleting the user
      // will automatically delete all related data (accounts, tokens, tags, socials, etc.)
      await this.userSection.delete(userId);

      return true;
    } catch (error) {
      this.handleError(`Failed to delete user: ${userId}`, error);
    }
  }
}

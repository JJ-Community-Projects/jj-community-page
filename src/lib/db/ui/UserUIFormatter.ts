import type {
  User,
  Account,
  UserTag,
  UserSocial,
  UserStyle,
  UserWithAccounts,
  UserWithTags
} from "../types/user.ts";
import type { Schedule } from "../types/schedule.ts";
import type { Team } from "../types/team.ts";
import type {
  UserUI,
  UserAccountUI,
  UserTagUI,
  UserSocialUI,
  UserStyleUI,
  UserProfileUI,
  UserScheduleUI,
  UserTeamUI,
  UserLiveInfoUI,
  UserListItemUI,
  UserFriendUI,
  UserFriendRequestUI
} from "./types/user.ts";

/**
 * Formatter for user-related UI data
 */
export class UserUIFormatter {
  /**
   * Formats a user for display
   * @param user - The user to format
   * @param accounts - The user's accounts
   * @param tags - The user's tags
   * @param socials - The user's social links
   * @param style - The user's style preferences
   * @returns The formatted user
   */
  formatUserForDisplay(
    user: User,
    accounts: Account[],
    tags: UserTag[],
    socials: UserSocial[] = [],
    style: UserStyle | null = null
  ): UserUI {
    return {
      id: user.id,
      role: user.role,
      primaryLiveStream: user.primaryLiveStream,
      createdAt: this.formatDate(user.createdAt),
      accounts: accounts.map(account => this.formatAccount(account)),
      tags: tags.map(tag => this.formatTag(tag)),
      socials: socials.map(social => this.formatSocial(social)),
      style: style ? this.formatStyle(style) : null
    };
  }

  /**
   * Formats a user profile
   * @param user - The user to format
   * @param accounts - The user's accounts
   * @param tags - The user's tags
   * @param socials - The user's social links
   * @param style - The user's style preferences
   * @param schedules - The user's schedules
   * @param teams - The user's teams
   * @param isLive - Whether the user is currently live
   * @param liveInfo - Information about the user's live stream
   * @returns The formatted user profile
   */
  formatUserProfile(
    user: User,
    accounts: Account[],
    tags: UserTag[],
    socials: UserSocial[] = [],
    style: UserStyle | null = null,
    schedules: Schedule[] = [],
    teams: { team: Team, isOwner: boolean }[] = [],
    isLive: boolean = false,
    liveInfo: UserLiveInfoUI | null = null
  ): UserProfileUI {
    return {
      id: user.id,
      role: user.role,
      primaryLiveStream: user.primaryLiveStream,
      createdAt: this.formatDate(user.createdAt),
      accounts: accounts.map(account => this.formatAccount(account)),
      tags: tags.map(tag => this.formatTag(tag)),
      socials: socials.map(social => this.formatSocial(social)),
      style: style ? this.formatStyle(style) : null,
      schedules: schedules.map(schedule => this.formatSchedule(schedule)),
      teams: teams.map(({ team, isOwner }) => this.formatTeam(team, isOwner)),
      isLive,
      liveInfo
    };
  }

  /**
   * Formats a user for a list
   * @param user - The user to format
   * @param tags - The user's tags
   * @param displayName - The user's display name
   * @param avatar - The user's avatar URL
   * @param isLive - Whether the user is currently live
   * @returns The formatted user list item
   */
  formatUserForList(
    user: User,
    tags: UserTag[],
    displayName: string,
    avatar: string | null = null,
    isLive: boolean = false
  ): UserListItemUI {
    return {
      id: user.id,
      role: user.role,
      primaryLiveStream: user.primaryLiveStream,
      createdAt: this.formatDate(user.createdAt),
      displayName,
      avatar,
      isLive,
      tags: tags.map(tag => this.formatTag(tag))
    };
  }

  /**
   * Formats a user as a friend
   * @param user - The user to format
   * @param displayName - The user's display name
   * @param avatar - The user's avatar URL
   * @param isLive - Whether the user is currently live
   * @returns The formatted friend
   */
  formatFriend(
    user: User,
    displayName: string,
    avatar: string | null = null,
    isLive: boolean = false
  ): UserFriendUI {
    return {
      id: user.id,
      displayName,
      avatar,
      isLive,
      primaryLiveStream: user.primaryLiveStream
    };
  }

  /**
   * Formats a friend request
   * @param user - The user to format
   * @param displayName - The user's display name
   * @param avatar - The user's avatar URL
   * @param createdAt - When the friend request was created
   * @param direction - The direction of the friend request
   * @returns The formatted friend request
   */
  formatFriendRequest(
    user: User,
    displayName: string,
    avatar: string | null = null,
    createdAt: Date | string,
    direction: 'incoming' | 'outgoing'
  ): UserFriendRequestUI {
    return {
      id: user.id,
      displayName,
      avatar,
      createdAt: this.formatDate(createdAt),
      direction
    };
  }

  /**
   * Formats a user account
   * @param account - The account to format
   * @returns The formatted account
   */
  private formatAccount(account: Account): UserAccountUI {
    return {
      provider: account.provider,
      providerUsername: account.providerUsername,
      providerDisplayName: account.meta?.displayName,
      avatarUrl: account.meta?.avatar,
      createdAt: this.formatDate(account.createdAt),
      updatedAt: this.formatDate(account.updatedAt)
    };
  }

  /**
   * Formats a user tag
   * @param tag - The tag to format
   * @returns The formatted tag
   */
  private formatTag(tag: UserTag): UserTagUI {
    return {
      tag: tag.tag,
      label: tag.label,
      color: this.getTagColor(tag.tag),
      addedAt: this.formatDate(tag.addedAt)
    };
  }

  /**
   * Formats a user social link
   * @param social - The social link to format
   * @returns The formatted social link
   */
  private formatSocial(social: UserSocial): UserSocialUI {
    return {
      provider: social.provider,
      url: social.url,
      displayName: this.getSocialDisplayName(social.provider),
      icon: this.getSocialIcon(social.provider)
    };
  }

  /**
   * Formats user style preferences
   * @param style - The style preferences to format
   * @returns The formatted style preferences
   */
  private formatStyle(style: UserStyle): UserStyleUI {
    return {
      primaryColor: style.primaryColor,
      accentColor: style.accentColor
    };
  }

  /**
   * Formats a schedule for user profile
   * @param schedule - The schedule to format
   * @returns The formatted schedule
   */
  private formatSchedule(schedule: Schedule): UserScheduleUI {
    return {
      id: schedule.id,
      title: schedule.title,
      slug: schedule.slug,
      year: schedule.year,
      visible: schedule.visible,
      primary: schedule.primary,
      streamCount: 0, // Would need to be provided
      createdAt: this.formatDate(schedule.createdAt),
      updatedAt: this.formatDate(schedule.updatedAt)
    };
  }

  /**
   * Formats a team for user profile
   * @param team - The team to format
   * @param isOwner - Whether the user is the owner of the team
   * @returns The formatted team
   */
  private formatTeam(team: Team, isOwner: boolean): UserTeamUI {
    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      visible: team.visible,
      isOwner,
      memberCount: 0 // Would need to be provided
    };
  }

  /**
   * Gets a display name for a social provider
   * @param provider - The social provider
   * @returns The display name
   */
  private getSocialDisplayName(provider: string): string {
    const displayNames: Record<string, string> = {
      'twitch': 'Twitch',
      'twitter': 'Twitter',
      'youtube': 'YouTube',
      'instagram': 'Instagram',
      'discord': 'Discord',
      'github': 'GitHub',
      'reddit': 'Reddit',
      'tiktok': 'TikTok',
      'facebook': 'Facebook',
      'linkedin': 'LinkedIn'
    };

    return displayNames[provider.toLowerCase()] || provider;
  }

  /**
   * Gets an icon for a social provider
   * @param provider - The social provider
   * @returns The icon name
   */
  private getSocialIcon(provider: string): string {
    // This would return an icon name or class that the frontend can use
    return provider.toLowerCase();
  }

  /**
   * Gets a color for a tag
   * @param tag - The tag
   * @returns The color for the tag
   */
  private getTagColor(tag: string): string {
    // Map tags to colors or use a hash function
    const tagColors: Record<string, string> = {
      'streamer': '#e30e50',
      'developer': '#3584bf',
      'artist': '#f67932',
      'musician': '#8a2be2',
      'admin': '#ff0000',
      'moderator': '#00aa00',
      // Add more tag colors as needed
    };

    return tagColors[tag] || '#6b7280'; // Default gray color
  }

  /**
   * Formats a date
   * @param date - The date to format
   * @returns The formatted date
   */
  private formatDate(date: Date | string | number): string {
    const dateObj = new Date(date);
    return dateObj.toISOString();
  }
}

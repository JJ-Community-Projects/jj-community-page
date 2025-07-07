import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {RepoEnv} from "./Repo.ts";
import {UserRepo} from "./UserRepo.ts";
import type {ActionAPIContext} from "astro:actions";
import {accounts, users, userSocials, userStyles, userTags} from "../schema/auth-schema.ts";
import {and, eq} from "drizzle-orm";
import {ScheduleUIRepo} from "./ScheduleUIRepo.ts";
import type {UserLiveState, UserPageUI, UserStyle} from "../models/user-ui.ts";
import type {TiltifyUserData} from "../../../functions/tiltify.ts";
import {teamMembersTable, teamsTable} from "../schema/jj-schema.ts";
import {TwitchRepo} from "./TwitchRepo.ts";

export class UserUIRepo {
  private db: DrizzleD1Database
  private repoEnv: RepoEnv
  private userRepo: UserRepo;
  private scheduleUIRepo: ScheduleUIRepo;
  private twitchRepo: TwitchRepo;
  private env: Env

  constructor(env: Env, repoEnv: RepoEnv) {
    this.db = drizzle(env.DB);
    this.env = env;
    this.repoEnv = repoEnv;
    this.userRepo = new UserRepo(this.env, repoEnv);
    this.scheduleUIRepo = new ScheduleUIRepo(this.env, repoEnv);
    this.twitchRepo = new TwitchRepo(this.env, repoEnv);
  }

  static action(ctx: ActionAPIContext) {
    return new UserUIRepo(ctx.locals.runtime.env, 'action')
  }

  private async getUserPageData(user: {
    meta: TiltifyUserData
    id: number
    primaryLiveStream: string
    role: "user" | "admin"
  }): Promise<UserPageUI> {

    const socials = await this.db.select({
      provider: userSocials.provider,
      url: userSocials.url,
    })
      .from(userSocials)
      .where(eq(userSocials.userId, user.id))
      .all();

    const tags = await this.db
      .select({
        label: userTags.label,
        tag: userTags.tag,
      })
      .from(userTags)
      .where(eq(userTags.userId, user.id))
      .all()

    const tiltifyAccount = user.meta

    const twitchChannel = await this.twitchRepo.getChannelByUserId(user.id)

    const schedule = await this.scheduleUIRepo.getCurrentPrimary(user.id)

    // Get the user's style using the getUserStyle method
    const style = await this.getUserStyle(user.id);

    const stream = twitchChannel ? await this.twitchRepo.getStreamByUserId(twitchChannel.id): null

    // Create the live state object
    const liveState: UserLiveState = {
      id: user.id,
      name: tiltifyAccount.username || '',
      slug: tiltifyAccount.slug || '',
      isLive: stream !== null,
      primaryLiveStream: user.primaryLiveStream,
      channel: {
        twitch: twitchChannel ? twitchChannel : undefined
      }
    };

    const teams = await this.getUserTeams(user.id);

    // Return the complete UserUI object
    return {
      id: user.id,
      name: tiltifyAccount.username || '',
      slug: tiltifyAccount.slug || '',
      style,
      tags,
      schedule,
      liveState,
      socials,
      teams
    };
  }

  async getUserById(id: number): Promise<UserPageUI | null> {
    const user = await this.getTiltifyAndUserDataById(id)
    if (!user) {
      return null;
    }
    return this.getUserPageData(user);
  }

  async getUserByName(username: string): Promise<UserPageUI | null> {
    const user = await this.getTiltifyAndUserDataByName(username)
    if (!user) {
      return null;
    }
    return this.getUserPageData(user);
  }

  private async getTiltifyAndUserDataById(userId: number) {
    const data = await this.db
      .select({
        id: users.id,
        primaryLiveStream: users.primaryLiveStream,
        role: users.role,
        meta: accounts.meta
      })
      .from(users)
      .innerJoin(
        accounts,
        eq(users.id, accounts.userId)
      )
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, 'tiltify')
        )
      ).get()

    if (!data) {
      return null
    }

    return {
      ...data,
      meta: data?.meta as TiltifyUserData
    }
  }

  private async getTiltifyAndUserDataByName(username: string) {
    const data = await this.db
      .select({
        id: users.id,
        primaryLiveStream: users.primaryLiveStream,
        role: users.role,
        meta: accounts.meta
      })
      .from(users)
      .innerJoin(
        accounts,
        eq(users.id, accounts.userId)
      )
      .where(
        and(
          eq(accounts.providerUsername, username),
          eq(accounts.provider, 'tiltify')
        )
      ).get()

    if (!data) {
      return null
    }

    return {
      ...data,
      meta: data?.meta as TiltifyUserData
    }
  }

  private async getUserTeams(userId: number) {
    return this.db.select({
      id: teamsTable.id,
      name: teamsTable.name,
      description: teamsTable.description,
      slug: teamsTable.slug,
    })
      .from(teamsTable)
      .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
      .where(
        and(
          eq(teamsTable.visible, true),
          eq(teamMembersTable.userId, userId)
        )
      ).all();
  }

  /**
   * Get all users in the UserPageUI format
   * @returns Promise<UserPageUI[]> Array of all users in UserPageUI format
   */
  async getAllUsers(): Promise<UserPageUI[]> {
    // Get all users with their Tiltify account data
    const allUsers = await this.db
      .select({
        id: users.id,
        primaryLiveStream: users.primaryLiveStream,
        role: users.role,
        meta: accounts.meta
      })
      .from(users)
      .innerJoin(
        accounts,
        eq(users.id, accounts.userId)
      )
      .where(
        eq(accounts.provider, 'tiltify')
      ).all();

    // Transform each user into a UserPageUI object
    const userPromises = allUsers.map(user => {
      return this.getUserPageData({
        ...user,
        meta: user.meta as TiltifyUserData
      });
    });

    // Wait for all transformations to complete
    return Promise.all(userPromises);
  }

  /**
   * Get the UserStyle for a specific user
   * @param userId The ID of the user
   * @returns Promise<UserStyle> The user's style information
   */
  async getUserStyle(userId: number): Promise<UserStyle> {
    // Get the user's Tiltify data
    const userData = await this.getTiltifyAndUserDataById(userId);

    // Get the user's style from the database
    const userStyle = await this.db
      .select()
      .from(userStyles)
      .where(eq(userStyles.userId, userId))
      .get();

    // Get the user's Twitch channel
    const twitchChannel = await this.twitchRepo.getChannelByUserId(userId);

    // Determine profile image URL based on requirements
    let profileImageUrl = '';
    if (twitchChannel && twitchChannel.profileImageUrl) {
      profileImageUrl = twitchChannel.profileImageUrl;
    } else if (userData && userData.meta && userData.meta.avatar && userData.meta.avatar.src) {
      profileImageUrl = userData.meta.avatar.src;
    }

    // Create and return the style object
    return {
      primaryColor: userStyle?.primaryColor || '#E30E50',
      accentColor: userStyle?.accentColor || '#3584BF',
      profileImage: {
        default: profileImageUrl,
        mobile: profileImageUrl
      }
    };
  }


  private getCachedUserPageUI(userId: number) {

  }
}

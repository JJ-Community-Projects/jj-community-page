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
  private env: RepoEnv
  private userRepo: UserRepo;
  private scheduleUIRepo: ScheduleUIRepo;

  constructor(db: DrizzleD1Database, env: RepoEnv) {
    this.db = db;
    this.env = env;
    this.userRepo = new UserRepo(db, env);
    this.scheduleUIRepo = new ScheduleUIRepo(db, env);
  }

  static action(ctx: ActionAPIContext) {
    return new UserUIRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
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

    const twitchRepo = new TwitchRepo(this.db, this.env);
    const twitchChannel = await twitchRepo.getChannelByUserId(user.id)

    const userStyle = await this.db
      .select()
      .from(userStyles)
      .where(eq(userStyles.userId, user.id))
      .get()

    const schedule = await this.scheduleUIRepo.getCurrentPrimary(user.id)

    // Determine profile image URL based on requirements
    let profileImageUrl = '';
    if (twitchChannel && twitchChannel.profileImageUrl) {
      profileImageUrl = twitchChannel.profileImageUrl;
    } else if (tiltifyAccount && tiltifyAccount.avatar && tiltifyAccount.avatar.src) {
      profileImageUrl = tiltifyAccount.avatar.src;
    }

    // Create the style object
    const style: UserStyle = {
      primaryColor: userStyle?.primaryColor || '#E30E50',
      accentColor: userStyle?.accentColor || '#3584BF',
      profileImage: {
        default: profileImageUrl,
        mobile: profileImageUrl
      }
    };

    const stream = twitchChannel ? await twitchRepo.getStreamByUserId(twitchChannel.id): null

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
}

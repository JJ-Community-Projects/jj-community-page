import {TinybaseDO} from "./TinybaseDO.ts";
import {getDB, type JJDrizzleDatabase} from "../lib/db/db.ts";
import {userDisplayView} from "../lib/db/schema/views-schema.ts";
import {eq} from "drizzle-orm";


export class UserDO extends TinybaseDO {

  private readonly db: JJDrizzleDatabase;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = getDB(env)
  }

  async init(userId: number): Promise<void> {

  }

  async addFriendRequest(userId: number, fromUserId: number) {
    const request = await this.db.select({
      userId: userDisplayView.userId,
      primaryLiveStream: userDisplayView.primaryLiveStream,
      username: userDisplayView.username,
      profileImage: userDisplayView.profileImage,
      tiltifySlug: userDisplayView.tiltifySlug,
      tiltifyUrl: userDisplayView.tiltifyUrl,
    }).from(userDisplayView)
      .where(eq(userDisplayView.userId, fromUserId))
      .get()
    if (!request) {
      return;
    }
    this.store?.setRow('friend_requests', `${fromUserId}`, request);
  }

  async deleteFriendRequest(fromUserId: number): Promise<void> {}

  protected namespace(): string {
    return "UserDO";
  }

}

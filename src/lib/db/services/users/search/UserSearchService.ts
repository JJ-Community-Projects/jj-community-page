import {BaseService} from "../../BaseService.ts";
import {usersSearchView} from "../../../schema/views-schema.ts";
import {and, eq, like, not} from "drizzle-orm";
import type {ActionAPIContext} from "astro:actions";
import type {RepoEnv} from "../../../RepoEnv.ts";


export class UserSearchService extends BaseService {

  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  static action(ctx: ActionAPIContext) {
    return new UserSearchService(ctx.locals.runtime.env, 'action');
  }

  async searchByTiltifyUsername(
    username: string,
    includeSelf: boolean, userId: number, limit: number) {
    if (includeSelf) {
      return this.db.select()
        .from(usersSearchView)
        .where(
          like(usersSearchView.tiltifyUsername, `%${username}%`),
        ).limit(limit).all()
    }
    return this.db.select()
      .from(usersSearchView)
      .where(
        and(
          like(usersSearchView.tiltifyUsername, `%${username}%`),
          not(eq(usersSearchView.userId, userId))
        )
      ).limit(limit).all()
  }
}

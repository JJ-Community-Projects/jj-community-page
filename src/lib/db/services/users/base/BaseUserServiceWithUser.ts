import type { RepoEnv } from "../../../RepoEnv.ts";
import {BaseUserService} from "./BaseUserService.ts";

/**
 * Base service class for user-related operations within the context of a specific user
 *
 * This abstract class extends BaseUserService and adds user context functionality.
 * It serves as a foundation for services that operate on behalf of a specific user,
 * providing access to user-specific data and operations.
 */
export abstract class BaseUserServiceWithUser extends BaseUserService {

  /** The ID of the user this service operates for */
  protected userId: number

  /**
   * Creates a new BaseUserServiceWithUser instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The ID of the user this service operates for
   */
  protected constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.userId = userId;
  }

  /**
   * Refreshes the user's Durable Object to ensure data consistency
   *
   * This method updates the user's Durable Object with the latest data,
   * ensuring that any changes made to the user are reflected across the application.
   * It should be called after operations that modify user data.
   */
  protected async refreshDO() {
    const DO = this.env.UserDO;
    const id = DO.idFromName(`${this.userId}`);
    const stub = DO.get(id);
    const rpc = await stub.setMetaData(`${this.userId}`)
    // await stub.refresh(`${this.userId}`)
    await rpc.refresh()
  }
}

// src/lib/db/newRepos/twitch/base/BaseTwitchSection.ts
import { BaseSection } from "../../base/BaseSection.ts";
import type { RepoEnv } from "../../../../db/RepoEnv";

/**
 * Base class for Twitch-related sections that provides common functionality
 */
export abstract class BaseTwitchSection<T, TInsert> extends BaseSection<T, TInsert> {
  /**
   * Creates a new BaseTwitchSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }
}

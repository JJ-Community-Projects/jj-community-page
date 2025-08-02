// src/lib/db/newRepos/tiltify/base/BaseTiltifySection.ts
import { BaseSection } from "../../base/BaseSection.ts";
import type { RepoEnv } from "../../../../db/RepoEnv";

/**
 * Base class for Tiltify-related sections that provides common functionality
 */
export abstract class BaseTiltifySection<T, TInsert> extends BaseSection<T, TInsert> {
  /**
   * Creates a new BaseTiltifySection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }
}

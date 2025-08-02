import {BaseService} from "../../BaseService.ts";
import {TiltifyRepo} from "../../../repos/tiltify/TiltifyRepo.ts";
import {UserRepo} from "../../../repos/user/UserRepo.ts";
import {TwitchRepo} from "../../../repos/twitch/TwitchRepo.ts";
import type {RepoEnv} from "../../../RepoEnv.ts";
import {UserAuthorizationService} from "../UserAuthorizationService.ts";

/**
 * Base service class for user-related operations
 *
 * This abstract class initializes all user-related repositories
 * and serves as a base for more specific user services.
 */
export abstract class BaseUserService extends BaseService {
  /** Repository for user operations */
  protected userRepo: UserRepo;

  /** Repository for twitch operations */
  protected twitchRepo: TwitchRepo

  /** Repository for Tiltify operations */
  protected tiltifyRepo: TiltifyRepo;

  /** Service for authorization checks */
  protected authService: UserAuthorizationService;

  /**
   * Creates a new BaseUserService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  protected constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
    this.twitchRepo = new TwitchRepo(env, repoEnv);
    this.tiltifyRepo = new TiltifyRepo(env, repoEnv);
    this.authService = new UserAuthorizationService(env, repoEnv);
  }
}

import {BaseService} from "../../BaseService.ts";
import {ScheduleService} from "../ScheduleService.ts";
import {ScheduleRepo} from "../../../repos/schedules/ScheduleRepo.ts";
import {StreamRepo} from "../../../repos/schedules/StreamRepo.ts";
import {StreamTagRepo} from "../../../repos/schedules/StreamTagRepo.ts";
import {StreamParticipantRepo} from "../../../repos/schedules/StreamParticipantRepo.ts";
import {AuthorizationService} from "../../AuthorizationService.ts";
import {UserRepo} from "../../../repos/users/UserRepo.ts";
import {ScheduleValidator} from "../ScheduleValidator.ts";
import {StreamService} from "../StreamService.ts";
import type {RepoEnv} from "../../../repos/BaseRepo.ts";


export abstract class BaseScheduleService extends BaseService {
  protected scheduleRepo: ScheduleRepo;
  protected streamRepo: StreamRepo;
  protected streamTagRepo: StreamTagRepo;
  protected streamParticipantRepo: StreamParticipantRepo;
  protected authService: AuthorizationService;
  protected userRepo: UserRepo;
  protected validator: ScheduleValidator;
  /**
   * Creates a new ScheduleService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
    this.scheduleRepo = new ScheduleRepo(env, repoEnv);
    this.streamRepo = new StreamRepo(env, repoEnv);
    this.streamTagRepo = new StreamTagRepo(env, repoEnv);
    this.streamParticipantRepo = new StreamParticipantRepo(env, repoEnv);
    this.authService = new AuthorizationService(env, repoEnv);
    this.userRepo = new UserRepo(env, repoEnv);
    this.validator = new ScheduleValidator(env, repoEnv);
  }
}

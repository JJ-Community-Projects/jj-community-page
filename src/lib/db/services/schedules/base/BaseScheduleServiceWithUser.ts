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
import {BaseScheduleService} from "./BaseScheduleService.ts";


export abstract class BaseScheduleServiceWithUser extends BaseScheduleService {
  protected userId: number

  /**
   * Creates a new ScheduleService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param userId - The user ID
   */
  protected constructor(env: Env, repoEnv: RepoEnv, userId: number) {
    super(env, repoEnv);
    this.userId = userId
  }

  protected async refreshUserDO() {
    const DO = this.env.UserDO;
    const id = DO.idFromName(`${this.userId}`);
    const stub = DO.get(id);
    const rpc = await stub.setMetaData(`${this.userId}`)
    // await stub.refresh(`${this.userId}`)
    await rpc.refresh()
  }
}

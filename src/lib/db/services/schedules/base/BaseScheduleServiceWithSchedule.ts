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


export abstract class BaseScheduleServiceWithSchedule extends BaseScheduleService {
  protected scheduleId: number
  /**
   * Creates a new ScheduleService instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   * @param scheduleId - The schedule ID
   */
  constructor(env: Env, repoEnv: RepoEnv, scheduleId: number) {
    super(env, repoEnv);
    this.scheduleId = scheduleId
  }


  protected async refreshScheduleDO() {
    const DO = this.env.ScheduleEditorDO;
    const id = DO.idFromName(`${this.scheduleId}`);
    const stub = DO.get(id);
    const rpc = await stub.setMetaData(`${this.scheduleId}`)
    // await stub.refresh(`${this.userId}`)
    // TODO await rpc.refresh()
  }
}

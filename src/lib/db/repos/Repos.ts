import {UserRepo} from "./UserRepo.ts";
import {TeamRepo} from "./TeamRepo.ts";
import {ScheduleRepo} from "./ScheduleRepo.ts";

export type Repos = {
  users: UserRepo,
  teams: TeamRepo,
  schedules: ScheduleRepo
}

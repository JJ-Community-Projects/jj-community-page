import {UserRepo} from "./UserRepo.ts";
import {TeamRepo} from "./TeamRepo.ts";
import {ScheduleRepo} from "./ScheduleRepo.ts";
import {TwitchRepo} from "./TwitchRepo.ts";

export type Repos = {
  users: UserRepo,
  teams: TeamRepo,
  schedules: ScheduleRepo,
  twitch: TwitchRepo
}

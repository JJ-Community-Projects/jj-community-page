import {UserRepo} from "./UserRepo.ts";
import {UserTagRepo} from "./UserTagRepo.ts";
import {TeamRepo} from "./TeamRepo.ts";
import {ScheduleRepo} from "./ScheduleRepo.ts";
import {TwitchRepo} from "./TwitchRepo.ts";

export type Repos = {
  users: UserRepo,
  userTags: UserTagRepo,
  teams: TeamRepo,
  schedules: ScheduleRepo,
  twitch: TwitchRepo
}

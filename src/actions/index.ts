import { auth } from "./auth";
import {schedules} from "./schedules.ts";
import {users} from "./users.ts";
import {teamInvites, teams} from "./teams.ts";

export const server = {
  auth,
  schedules,
  users,
  teams,
  teamInvites,
}

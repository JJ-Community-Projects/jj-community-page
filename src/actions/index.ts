import { auth } from "./auth";
import {schedules} from "./schedules/index.ts";
import {friends, users} from "./users/index.ts";
import {teamInvites, teams} from "./teams/index.ts";
import {ui} from "./ui.ts";
import {twitch} from "./twitch.ts";
import {tiltify} from "./tiltify.ts";
import {tiltifyMetadata} from "./tiltify-metadata.ts";

export const server = {
  auth,
  schedules,
  users,
  friends,
  teams,
  teamInvites,
  ui,
  twitch,
  tiltify,
  tiltifyMetadata
}

import {os} from "@orpc/server";
import {discoverRouter} from "./discovery/impl.ts";
import {friendsRouter} from "./relations/impl.ts";
import {
  getAllUsers,
  getAllUsersPaged,
  getTwitchChannelByUserId,
  getTwitchChannelByUserSlug,
  getUserBySlug,
  getUserProfileBySlug
} from "./impl.ts";

export const usersRouter = os.router({
  search: discoverRouter,
  friends: friendsRouter,
  getUserBySlug: getUserBySlug,
  getUserProfileBySlug: getUserProfileBySlug,
  getAllUsersPaged: getAllUsersPaged,
  getAllUsers: getAllUsers,
  getTwitchChannelByUserId: getTwitchChannelByUserId,
  getTwitchChannelByUserSlug: getTwitchChannelByUserSlug,
})

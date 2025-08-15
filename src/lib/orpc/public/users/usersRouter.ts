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
  // Flattened search procedures
  searchByName: discoverRouter.byUsername,
  searchByNameDisplay: discoverRouter.byUsernameDisplay,
  searchSimilarUsers: discoverRouter.similarUsers,
  // Flattened friends procedures
  getFriends: friendsRouter.listFriendsByUserId,
  // Existing procedures
  getUserBySlug: getUserBySlug,
  getUserProfileBySlug: getUserProfileBySlug,
  getAllUsersPaged: getAllUsersPaged,
  getAllUsers: getAllUsers,
  getTwitchChannelByUserId: getTwitchChannelByUserId,
  getTwitchChannelByUserSlug: getTwitchChannelByUserSlug,
})

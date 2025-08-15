import {os} from "@orpc/server";
import {blockRouter} from "./blocks/impl.ts";
import {friendsRouter} from "./friends/impl.ts";

export const relationsRouter = os.router({
  friends: friendsRouter,
  block: blockRouter,
});

import {os} from "@orpc/server";
import {usersRouter} from "./users/usersRouter.ts";
import {publicTeamsRouter} from "./teams/impl.ts";
import {schedulesRouter} from "./schedules/impl.ts";

export const publicRouter = os.router({
  users: usersRouter,
  teams: publicTeamsRouter,
  schedules: schedulesRouter
})

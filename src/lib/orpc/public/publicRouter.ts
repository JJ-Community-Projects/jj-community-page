import {os} from "@orpc/server";
import {usersRouter} from "./users/usersRouter.ts";
import {teamsRouter} from "./teams/teamsRouter.ts";

export const publicRouter = os.router({
  users: usersRouter,
  teams: teamsRouter,
})

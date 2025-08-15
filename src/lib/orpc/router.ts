import {os} from '@orpc/server'
import {privateRouter} from "./private/privateRouter.ts";
import {publicRouter} from "./public/publicRouter.ts";
import {hasAstroContext} from "./middleware/hasAstroContext.ts";

export const router = os
  .use(hasAstroContext)
  .router({
    private: privateRouter,
    public: publicRouter,
  })

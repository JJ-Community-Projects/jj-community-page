import {ActionError, defineAction} from "astro:actions";
import {getDB} from "../lib/db/db.ts";
import {accounts} from "../lib/db/schema/auth-schema.ts";
import {eq} from "drizzle-orm";


export const auth = {
  getAccounts: defineAction({
    handler: async (_, context) => {
      const {session, user} = context.locals

      if (!session || !user) {
        throw new ActionError({ code: 'UNAUTHORIZED' });
      }

      const userId = user.id;


      const db = getDB(context)
      const account = await db.select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .all()

      if (!account) {
        throw new ActionError({ code: 'NOT_FOUND' });
      }
      return account;
    }
  })
}

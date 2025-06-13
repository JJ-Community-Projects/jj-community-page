// import {loadAllCreatorsFromContent} from "../content/loadCreatorsFromContent.ts";
import {getDB} from "../lib/db/db.ts";
import {accounts} from "../lib/db/schema/auth-schema.ts";
import {eq, not} from "drizzle-orm";
import type {AstroContext} from "../lib/AstroContext.ts";

export async function getBlockedNames(ctx: AstroContext) {
  // Get creator names from content
  const creators: {name: string}[] = [] // await loadAllCreatorsFromContent();
  const creatorNames = creators.map((creator) => {
    return creator.name.toLowerCase();
  });

  // Get all provider usernames from accounts except the current user's
  const db = getDB(ctx);
  const currentUser = ctx.locals.user;


  if (currentUser) {
    const accountsResult = await db
      .select({
        providerUsername: accounts.providerUsername
      })
      .from(accounts).where(not(eq(accounts.userId, currentUser.id)))
      .all();

    const providerUsernames = accountsResult.map(account => account.providerUsername.toLowerCase());

    // Combine both lists
    return ['yogscast', ...creatorNames, ...providerUsernames];
  } else {
    let accountsResult = await db
      .select({
        providerUsername: accounts.providerUsername
      })
      .from(accounts).all()

    const providerUsernames = accountsResult.map(account => account.providerUsername.toLowerCase());

    // Combine both lists
    return ['yogscast', ...creatorNames, ...providerUsernames];

  }


}

import {friendsContract} from './contract.ts';
import {implement} from '@orpc/server';
import {dbMiddleware} from "../../../middleware/dbMiddleware.ts";
import {friendsTable} from '../../../../db/schema/auth-schema.ts';
import {userDisplayView} from '../../../../db/schema/views-schema.ts';
import {eq} from 'drizzle-orm';

const os = implement(friendsContract)
  .use(dbMiddleware);

// List friends by user ID implementation
const listFriendsByUserId = os.listFriendsByUserId
  .handler(async ({context, input}) => {
    const db = context.db;
    const {userId} = input;

    // Get all friends of the specified user
    return db.select({
      userId: userDisplayView.userId,
      primaryLiveStream: userDisplayView.primaryLiveStream,
      role: userDisplayView.role,
      createdAt: userDisplayView.createdAt,
      username: userDisplayView.username,
      profileImage: userDisplayView.profileImage,
      twitchLogin: userDisplayView.twitchLogin,
      tiltifySlug: userDisplayView.tiltifySlug,
      tiltifyUrl: userDisplayView.tiltifyUrl,
      primaryColor: userDisplayView.primaryColor,
      accentColor: userDisplayView.accentColor,
    })
      .from(friendsTable)
      .innerJoin(userDisplayView,
        eq(userDisplayView.userId, friendsTable.toUserId),
      )
      .where(
        eq(friendsTable.fromUserId, userId),
      )
      .all();
  });

export const friendsRouter = {
  listFriendsByUserId,
};

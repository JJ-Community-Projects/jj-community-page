import { getDB } from '../../../db/db.ts'
import {
  getSendUserFriendRequests,
  getUserFriendRequests,
  getUserFriends,
} from './util.ts'
import { friendsChannels } from './channels.ts'

export async function publishFriendRequestSentUpdate(
  env: Env,
  fromUserId: number,
) {
  try {
    const db = getDB(env)
    const DO = env.FriendRequestSentObject
    const channelId = friendsChannels.userSentRequests(fromUserId)
    const stub = DO.get(DO.idFromName(channelId))
    const requests = await getSendUserFriendRequests(db, fromUserId)
    await stub.publishChange(requests)
  } catch (e) {
    console.error('Error publishing FriendRequestSentObject:', e)
  }
}

export async function publishFriendRequestIncomingUpdate(
  env: Env,
  fromUserId: number,
) {
  try {
    const db = getDB(env)
    const DO = env.FriendRequestIncomingObject
    const channelId = friendsChannels.userIncomingRequests(fromUserId)
    const stub = DO.get(DO.idFromName(channelId))
    const requests = await getUserFriendRequests(db, fromUserId)
    await stub.publishChange(requests)
  } catch (e) {
    console.error('Error publishing FriendRequestIncomingObject:', e)
  }
}

export async function publishFriendsListUpdate(env: Env, userId: number) {
  try {
    const db = getDB(env)
    const DO = env.FriendsListObject
    const channelId = friendsChannels.userFriendsList(userId)
    const stub = DO.get(DO.idFromName(channelId))
    const friends = await getUserFriends(db, userId)
    await stub.publishChange(friends)
  } catch (e) {
    console.error('Error publishing FriendsListObject:', e)
  }
}

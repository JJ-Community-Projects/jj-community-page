import { friendsChannels } from './channels.ts'

// After a mutation: the channel object reloads the list from D1 and sends it, but only when a
// socket is open. A failed update is logged, not thrown: the mutation has already been saved.

export async function publishFriendRequestSentUpdate(
  env: Env,
  fromUserId: number,
) {
  try {
    const DO = env.FriendRequestSentObject
    const channelId = friendsChannels.userSentRequests(fromUserId)
    await DO.get(DO.idFromName(channelId)).refresh(fromUserId)
  } catch (e) {
    console.error('Error publishing FriendRequestSentObject:', e)
  }
}

export async function publishFriendRequestIncomingUpdate(
  env: Env,
  toUserId: number,
) {
  try {
    const DO = env.FriendRequestIncomingObject
    const channelId = friendsChannels.userIncomingRequests(toUserId)
    await DO.get(DO.idFromName(channelId)).refresh(toUserId)
  } catch (e) {
    console.error('Error publishing FriendRequestIncomingObject:', e)
  }
}

export async function publishFriendsListUpdate(env: Env, userId: number) {
  try {
    const DO = env.FriendsListObject
    const channelId = friendsChannels.userFriendsList(userId)
    await DO.get(DO.idFromName(channelId)).refresh(userId)
  } catch (e) {
    console.error('Error publishing FriendsListObject:', e)
  }
}
